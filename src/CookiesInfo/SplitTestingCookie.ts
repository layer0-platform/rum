import { Cookie } from "./Cookie";

export type SplitTestingCookie = Cookie & {
    experimentName: string;
    experimentId: string;
    variantName: string;
    variantId: string;
}