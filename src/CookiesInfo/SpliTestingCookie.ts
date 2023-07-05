import { Cookie } from "./Cookie";

export type SpliTestingCookie = Cookie & {
    experimentName: string;
    experimentId: string;
    variantName: string;
    variantId: string;
}