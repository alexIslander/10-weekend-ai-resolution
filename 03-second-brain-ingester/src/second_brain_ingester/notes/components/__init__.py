"""Concrete note components."""

from second_brain_ingester.notes.components.linker import DeterministicNoteLinker
from second_brain_ingester.notes.components.srq import DeterministicSrqGenerator

__all__ = ["DeterministicNoteLinker", "DeterministicSrqGenerator"]
