import { Cookie } from './Cookie';
import { Lazy } from './Lazy';
import { SplitTestingCookie } from './SplitTestingCookie';

const getAllCookies= (): Cookie[]  => {
    const allCokies = document.cookie
        .split('; ')
        .map(c => c.split('='))
        .map(([key, value]) => ({ key, value }))

    return allCokies;
}

const getSplitTestingCookies = (cookies: Cookie[]): SplitTestingCookie[] => {
    const splitTestingCookies = cookies
        .map(c => extractSplitTestingCookie(c))
        .filter(c => c !== undefined) as SplitTestingCookie[];

    return splitTestingCookies;
}

const extractSplitTestingCookie = (cookie: Cookie): SplitTestingCookie | undefined => {
    if (!cookie.key.startsWith('x-edg-experiment'))
        return undefined;

    // split key with regex and exract experiment name and id
    // when key is x-edg-experiment-<name>_<experimentId>
    const [_, experimentName, experimentId] = cookie.key.split(/x-edg-experiment-|_/);

    // split value with regex and exract variant name and id
    // when value is <name>_<variantId>
    const [variantName, variantId] = cookie.value.split(/_/);

    return {
        key: cookie.key,
        value: cookie.value,
        experimentName,
        experimentId,
        variantName,
        variantId
    }
}

/**
 * Provides information about cookies. It loads them only once on first access.
 * It will not be updated when cookies are changed. Please use new instance of this class to get updated information.
 * This is dedicated class used to extrac info about Edgio cookies.
 */
export class CookiesInfo {
    constructor() {
        this.cookiesLazy = new Lazy(() => getAllCookies());
        this.splitTestingCookiesLazy = new Lazy(() => getSplitTestingCookies(this.cookies));
    }

    private cookiesLazy: Lazy<Cookie[]>;

    get cookies() {
        return this.cookiesLazy.value;
    }

    private splitTestingCookiesLazy: Lazy<SplitTestingCookie[]>;

    get splitTestingCookies() {
        return this.splitTestingCookiesLazy.value;
    }
}

