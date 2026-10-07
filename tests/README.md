# Tests

Phase 0 only defines the test layout. Business tests will be added with the corresponding Spec Task:

- `unit/`: package-level behavior and boundary tests;
- `integration/`: cross-package and temporary workspace tests;
- `e2e/`: API/transport/user-flow acceptance tests.

Phase 0 contains only one smoke test per category to keep the test commands executable. No Agent business behavior is tested until Phase 1 or later.
