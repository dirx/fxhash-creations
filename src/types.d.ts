import type { FxHashApi } from '@fxhash/project-sdk'

declare global {
  interface Window {
    $fx: FxHashApi;
  }
}
