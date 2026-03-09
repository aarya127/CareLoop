"""CareLoop Pipecat bot entrypoint.

This is based on Pipecat's official quickstart and can run locally for testing.
Start it, then open http://localhost:7860/client and connect your microphone.
"""

import os
import http
from enum import Enum

from dotenv import load_dotenv
from loguru import logger

print("Starting CareLoop Pipecat bot...")
print("Loading models and imports (first run may take ~20s)\n")

logger.info("Loading Silero VAD model...")
from pipecat.audio.vad.silero import SileroVADAnalyzer

logger.info("Silero VAD model loaded")

from pipecat.frames.frames import LLMRunFrame
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.runner import PipelineRunner
from pipecat.pipeline.task import PipelineParams, PipelineTask
from pipecat.processors.aggregators.llm_context import LLMContext
from pipecat.processors.aggregators.llm_response_universal import (
    LLMContextAggregatorPair,
    LLMUserAggregatorParams,
)
from pipecat.runner.types import RunnerArguments
from pipecat.runner.utils import create_transport
from pipecat.services.cartesia.tts import CartesiaTTSService
from pipecat.services.deepgram.stt import DeepgramSTTService
from pipecat.services.openai.llm import OpenAILLMService
from pipecat.transports.base_transport import BaseTransport, TransportParams
from pipecat.transports.daily.transport import DailyParams

load_dotenv(override=True)


def _validate_required_env() -> None:
    required = ["DEEPGRAM_API_KEY", "OPENAI_API_KEY", "CARTESIA_API_KEY"]
    missing_or_placeholder = []

    for key in required:
        value = (os.getenv(key) or "").strip()
        if not value:
            missing_or_placeholder.append(f"{key} (missing)")
            continue
        lower = value.lower()
        if "your_" in lower or "api_key" in lower or value.endswith("_key"):
            missing_or_placeholder.append(f"{key} (placeholder)")

    if missing_or_placeholder:
        joined = ", ".join(missing_or_placeholder)
        raise RuntimeError(
            "Invalid Pipecat environment configuration: "
            f"{joined}. Update pipecat-agent/.env with real provider keys."
        )


async def run_bot(transport: BaseTransport, runner_args: RunnerArguments):
    logger.info("Starting CareLoop Pipecat pipeline")

    stt = DeepgramSTTService(api_key=os.getenv("DEEPGRAM_API_KEY"))
    tts = CartesiaTTSService(
        api_key=os.getenv("CARTESIA_API_KEY"),
        voice_id="71a7ad14-091c-4e8e-a314-022ece01c121",
    )
    llm = OpenAILLMService(api_key=os.getenv("OPENAI_API_KEY"))

    messages = [
        {
            "role": "system",
            "content": (
                "You are the CareLoop dental voice assistant. "
                "Be concise and empathetic. "
                "If a request is urgent medical emergency, advise immediate emergency services."
            ),
        }
    ]

    context = LLMContext(messages)
    user_aggregator, assistant_aggregator = LLMContextAggregatorPair(
        context,
        user_params=LLMUserAggregatorParams(vad_analyzer=SileroVADAnalyzer()),
    )

    pipeline = Pipeline(
        [
            transport.input(),
            stt,
            user_aggregator,
            llm,
            tts,
            transport.output(),
            assistant_aggregator,
        ]
    )

    task = PipelineTask(
        pipeline,
        params=PipelineParams(enable_metrics=True, enable_usage_metrics=True),
    )

    @transport.event_handler("on_client_connected")
    async def on_client_connected(_transport, _client):
        logger.info("Client connected")
        messages.append(
            {
                "role": "system",
                "content": "Say hello, identify as CareLoop assistant, and ask how you can help.",
            }
        )
        await task.queue_frames([LLMRunFrame()])

    @transport.event_handler("on_client_disconnected")
    async def on_client_disconnected(_transport, _client):
        logger.info("Client disconnected")
        await task.cancel()

    runner = PipelineRunner(handle_sigint=runner_args.handle_sigint)
    await runner.run(task)


async def bot(runner_args: RunnerArguments):
    transport_params = {
        "daily": lambda: DailyParams(
            audio_in_enabled=True,
            audio_out_enabled=True,
        ),
        "webrtc": lambda: TransportParams(
            audio_in_enabled=True,
            audio_out_enabled=True,
        ),
    }

    transport = await create_transport(runner_args, transport_params)
    await run_bot(transport, runner_args)


if __name__ == "__main__":
    # Pipecat runner currently imports http.HTTPMethod which is not present on Python 3.10.
    # Define a compatible fallback so local testing still works without forcing an interpreter upgrade.
    if not hasattr(http, "HTTPMethod"):
        class HTTPMethod(str, Enum):
            GET = "GET"
            POST = "POST"
            PUT = "PUT"
            DELETE = "DELETE"
            PATCH = "PATCH"
            HEAD = "HEAD"
            OPTIONS = "OPTIONS"
            TRACE = "TRACE"
            CONNECT = "CONNECT"

        http.HTTPMethod = HTTPMethod  # type: ignore[attr-defined]

    _validate_required_env()

    from pipecat.runner.run import main

    main()
