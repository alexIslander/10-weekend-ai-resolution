// The stage is a function of the ref and nothing else (ADR-0002).
//
// One rule, three readers: the planner, the describe-deploy CLI and the
// reusable workflow all ask here, so a manual run and a push cannot disagree
// about what `main` means.

const MAIN_REFS = ['main', 'refs/heads/main'];

export function stageFor(ref) {
  return MAIN_REFS.includes(ref) ? 'production' : 'staging';
}

// The Pages branch alias takes a branch name, not a ref. Staging passes this
// through as `--branch` (ADR-0006); production is hard-coded to `main` by the
// target table, so this is never used to choose production.
export function branchOf(ref) {
  if (typeof ref !== 'string') return undefined;
  return ref.replace(/^refs\/heads\//, '');
}
