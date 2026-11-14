/**
 * A board is derived from finished runs, never stored: these tests state how
 * that derivation ranks, ties and separates modes.
 *
 * Run with: node --test
 */
import test from "node:test";
import assert from "node:assert/strict";

import { boardOf, boardsOf, boardId } from "../app/src/quiz/core/boards.mjs";
import { HINT_LEVELS, MODES } from "../app/src/quiz/core/run.mjs";

const run = overrides => ({
  mode: "random",
  hintLevel: "test",
  score: 100,
  correct: 3,
  total: 57,
  startedAt: 1_000,
  finishedAt: 9_000,
  ...overrides
});

const players = {
  ada: {
    name: "ada",
    positions: {},
    runs: [
      run({ score: 100, startedAt: 1_000, finishedAt: 9_000 }), // 8 s
      run({ score: 200, startedAt: 1_000, finishedAt: 31_000 }), // 30 s
      run({ mode: "grouped", score: 999 }),
      run({ hintLevel: "training", score: 300 })
    ]
  },
  bob: {
    name: "bob",
    positions: {},
    runs: [run({ score: 200, startedAt: 5_000, finishedAt: 15_000 })] // 10 s
  }
};

const rows = ({ name, score, elapsed }) => ({ name, score, elapsed });

test("a board holds the finished runs of one mode at one hint level, best first", () => {
  assert.deepEqual(boardOf(players, { mode: "random", hintLevel: "test" }).map(rows), [
    { name: "bob", score: 200, elapsed: 10_000 },
    { name: "ada", score: 200, elapsed: 30_000 },
    { name: "ada", score: 100, elapsed: 8_000 }
  ]);
});

test("equal scores rank the faster run higher", () => {
  const board = boardOf(players, { mode: "random", hintLevel: "test" });
  const bothTwoHundred = board.filter(({ score }) => score === 200);
  assert.deepEqual(bothTwoHundred.map(rows), [
    { name: "bob", score: 200, elapsed: 10_000 },
    { name: "ada", score: 200, elapsed: 30_000 }
  ]);
});

test("runs of another mode or hint level never appear on this board", () => {
  const board = boardOf(players, { mode: "random", hintLevel: "test" });
  assert.equal(board.length, 3);
  assert.ok(board.every(({ score }) => score !== 999), "a grouped run is not on the random board");
  assert.ok(board.every(({ score }) => score !== 300), "a training run is not on the test board");
});

test("a board row carries name, score and the date it was finished", () => {
  const [first] = boardOf(players, { mode: "random", hintLevel: "test" });
  assert.deepEqual(
    { name: first.name, score: first.score, at: first.at, correct: first.correct, total: first.total },
    { name: "bob", score: 200, at: 15_000, correct: 3, total: 57 }
  );
});

test("a player with no finished run is on no board", () => {
  const idle = { cara: { name: "cara", positions: {}, runs: [] } };
  assert.deepEqual(boardOf(idle, { mode: "random", hintLevel: "test" }), []);
});

test("the same runs land on the board under their own name, never merged", () => {
  const board = boardOf(players, { mode: "random", hintLevel: "test" });
  assert.deepEqual([...new Set(board.map(({ name }) => name))].sort(), ["ada", "bob"]);
  assert.equal(board.filter(({ name }) => name === "ada").length, 2);
});

test("every mode carries one board per hint level, in plan order", () => {
  const boards = boardsOf(players);
  assert.deepEqual(boards.map(({ mode }) => mode), MODES);
  assert.deepEqual(boards[0].boards.map(({ hintLevel }) => hintLevel), HINT_LEVELS);
  assert.deepEqual(boards[0].boards.map(({ rows }) => rows.length), [1, 3], "training has ada's run, test has three");
});

test("a board can be read for any mode, but only the modes that ship get a page", () => {
  assert.deepEqual(boardOf(players, { mode: "grouped", hintLevel: "test" }).map(({ score }) => score), [999]);
  assert.deepEqual(boardsOf(players).map(({ mode }) => mode), ["random"], "only the modes that ship get a page");
});

test("a board's anchor is one spelling that the page and the finish screen share", () => {
  assert.equal(boardId({ mode: "random", hintLevel: "test" }), "board-random-test");
  assert.equal(boardId({ mode: "adaptive", hintLevel: "training" }), "board-adaptive-training");
});
