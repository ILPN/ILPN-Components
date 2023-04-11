export interface HeadingAnchorConfig {
    type: AnchorType,
    link?: string
}

export enum AnchorType {
    HREF,
    ROUTER
}
