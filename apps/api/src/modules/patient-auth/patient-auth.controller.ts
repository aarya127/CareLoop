import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { PatientAuthService } from './patient-auth.service';
import { PatientAuthGuard } from './patient-auth.guard';
import {
  AcceptPatientInvitationDto,
  CreatePatientInvitationDto,
  PatientForgotPasswordDto,
  PatientLoginDto,
  PatientResetPasswordDto,
} from './dto';
import { RequireRole } from '../../common/guards';
import { Public } from '../../common/decorators';
import { FRONT_OFFICE_ROLES } from '../auth/auth.constants';
import { PATIENT_SESSION_COOKIE } from './patient-auth.constants';
import { clearPatientSessionCookie, setPatientSessionCookie } from './patient-session-cookie';

// Every route here is @Public() because SessionAuthGuard (the staff guard) is
// global via APP_GUARD and would otherwise 401 these before they run — even the
// "authenticated" ones, which instead enforce PatientAuthGuard explicitly. The
// invite-creation route is the one exception: it intentionally stays behind the
// staff guard, since only staff may create a patient portal invite.
@Controller('patient-auth')
export class PatientAuthController {
  // Explicit @Inject token: the tsx/esbuild dev runtime does not emit
  // design:paramtypes metadata, so plain constructor injection resolves to
  // undefined here. Matches the pattern used in AuthController/SessionAuthGuard.
  constructor(@Inject(PatientAuthService) private readonly patientAuth: PatientAuthService) {}

  /** Staff (front-office+) invites an existing patient in their practice to the portal. */
  @Post('invitations')
  @RequireRole(...FRONT_OFFICE_ROLES)
  @HttpCode(HttpStatus.CREATED)
  createInvitation(@Body() dto: CreatePatientInvitationDto, @Req() req: any) {
    return this.patientAuth.invite(req.user.practiceId, req.user.id, dto);
  }

  /** Public: preview an invite before the patient accepts it. */
  @Public()
  @Get('invitations/accept/:token')
  previewInvitation(@Param('token') token: string) {
    return this.patientAuth.preview(token);
  }

  /** Public: accept an invite — creates the patient credential + a session. */
  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('invitations/accept/:token')
  @HttpCode(HttpStatus.CREATED)
  async acceptInvitation(
    @Param('token') token: string,
    @Body() dto: AcceptPatientInvitationDto,
    @Req() req: any,
    @Res({ passthrough: true }) res: any,
  ) {
    const result = await this.patientAuth.accept(token, dto, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
    setPatientSessionCookie(res, result.sessionToken);
    return { patient: result.patient };
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: PatientLoginDto, @Req() req: any, @Res({ passthrough: true }) res: any) {
    const result = await this.patientAuth.login(dto, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
    setPatientSessionCookie(res, result.sessionToken);
    return { patient: result.patient };
  }

  /** Always responds the same way whether or not the email matches a portal account. */
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: PatientForgotPasswordDto, @Req() req: any) {
    await this.patientAuth.forgotPassword(dto, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
    return { ok: true };
  }

  /** Public: preview a reset link before the patient sets a new password. */
  @Public()
  @Get('reset-password/:token')
  previewResetPassword(@Param('token') token: string) {
    return this.patientAuth.previewResetToken(token);
  }

  /** Public: consume a reset link — sets the new password and starts a fresh session. */
  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('reset-password/:token')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Param('token') token: string,
    @Body() dto: PatientResetPasswordDto,
    @Req() req: any,
    @Res({ passthrough: true }) res: any,
  ) {
    const result = await this.patientAuth.resetPassword(token, dto, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
    setPatientSessionCookie(res, result.sessionToken);
    return { patient: result.patient };
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: any, @Res({ passthrough: true }) res: any) {
    const token = req.patientSessionToken ?? req.cookies?.[PATIENT_SESSION_COOKIE];
    await this.patientAuth.logout(token);
    clearPatientSessionCookie(res);
    return { ok: true };
  }

  @Public()
  @UseGuards(PatientAuthGuard)
  @Get('me')
  async me(@Req() req: any) {
    const token = req.patientSessionToken ?? req.cookies?.[PATIENT_SESSION_COOKIE];
    const data = await this.patientAuth.getSession(token);
    if (!data) throw new UnauthorizedException('No active session');
    return data.patient;
  }
}
