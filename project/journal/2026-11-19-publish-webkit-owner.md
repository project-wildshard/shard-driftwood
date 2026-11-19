# Use the SDK's Playwright for Driftwood preparation

ONE-FORMAT harvest rehearsal 44529775138 passed the build and author
checks, then stopped because the workflow looked for Playwright from
the old sharddev alias. The split SDK puts it under the dev package.

Take the resolved WebKit install step from repo-kit `1efaf00`. It also
supports the older alias. Running the step's resolver against the pinned
install finds the dev package's Playwright 1.65.0. Follow with a rehearsal
on the exact preparation client before publishing the next revision.
