/** Represents a custom page */
interface Page {
  /** URL path */
  path: string;

  /** Absolute URL (site URL + path) */
  permalink: string;

  /**
   * Page type (for template usage)
   *
   * @example
   * ```
   * (page, site) => (page.type === 'page') ? 'page' : 'non-page';
   * ```
   */
  type: 'page';
  
  // Additional custom data for this page (optional)
  [key: string]: any;
}

/** Represents a message-reply pair post */
interface Post {
  /** URL path (pattern: /posts/:id.html) */
  path: string;

  /** Absolute URL */
  permalink: string;

  /** Page type */
  type: 'post';

  /** Unique ID based on timestamp */
  id: string;

  /** Message content as plaintext */
  message: string;

  /** When the message was sent (format: RFC 3339 'date-time' or 'full-date') */
  sent: string;

  /** Reply content as plaintext */
  reply: string;

  /** When the reply was last updated (format: RFC 3339 'date-time') */
  replied: string;

  /** URL path of the card image (pattern: /images/:id.png) */
  image: string;

  /** Pixel width of the card image */
  width: number;
  
  /** Pixel height of the card image */
  height: number;
}

/** Represents a paginated list of posts */
interface List {
  /** URL path (pattern: /lists/:number.html) */
  path: string;
  
  /** Absolute URL */
  permalink: string;

  /** Page type */
  type: 'list';

  paginator: {
    /** Current page number (1-based) */
    number: number;
 
    /** Posts on the current page */
    posts: Post[];

    /** Total number of posts in the site */
    totalPosts: number;

    /** Total number of pages in the pagination */
    totalPages: number;

    /** Path of the first page */
    first: string;

    /** Path of the previous page (null if on first page) */
    prev: string | null;

    /** Path of the next page (null if on last page) */
    next: string | null;

    /** Path of the last page */
    last: string;
  };
}

/** Site configuration and global data */
interface Site {
  /** Whether site accepts incoming messages */
  activated: boolean;

  /** Whether email notifications are enabled */
  notify: boolean;

  /** Email address for notifications (null if not configured) */
  email: string | null;

  /** Primary email sender to use when multiple senders are available */
  sender: 'google' | 'resend';

  /** Maximum allowed length for incoming messages */
  maxLength: number;

  /** Number of posts per page in the paginated lists */
  perPage: number;

  /** Site title (same as the sender name in notification emails) */
  title: string;

  /**
   * Time zone offset on the site (format: RFC 3339 'time-offset')
   * @example '+09:00'
   */
  timeOffset: string;

  /**
   * `timeOffset` in milliseconds (same sign)
   */
  timeOffsetMilliseconds: number;

  /**
   * Site URL without trailing slash
   * @example 'https://example.vercel.app'
   */
  baseURL: string;

  /** Generator metadata from package.json */
  generator: {
    /** From `displayName` field */
    name: string;

    /**
     * From `version` field.
     * Follows the Romantic Versioning format: PROJECT.MAJOR.MINOR
     * @example '1.0.0'
     */
    version: string;

    /** From `repository` field. GitHub repository URL. */
    repository: string;
  };

  /** All posts in the site */
  posts: Post[];

  // Additional custom data from config.json (optional)
  [key: string]: any;
}

/** Returns a complete HTML content for a list page */
export declare type renderList = (list: List, site: Site) => string;

/** Returns a complete HTML content for a post page */
export declare type renderPost = (post: Post, site: Site) => string;

/**
 * Hooks called at different stages of the rendering process.
 * Currently only `prerender` is supported, but more may be added in future.
 */
export declare type hooks = {
  /** Called before rendering begins. Output directories may not exist yet. */
  prerender?: (site: Site) => void;
};

/**
 * Custom pages configuration.
 * Should include `/submit/ok.html` and `/404.html` pages.
 */
export declare type pages = {
  /**
   * Page configuration where the key is the URL path.
   * Each key becomes the `path` property of the resulting `Page` instance,
   * and all properties are shallow-copied to that.
   */
  [path: string]: {
    /** Returns a complete HTML content for this page */
    layout: (page: Page, site: Site) => string;

    // Additional custom data for this page (optional)
    [key: string]: any;
  };
};
