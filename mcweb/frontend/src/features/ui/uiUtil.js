
// to save us typing redundant info when using MUI <Menu>s
export const defaultMenuOriginProps = {
  anchorOrigin: { vertical: 'bottom', horizontal: 'right' },
  transformOrigin: { vertical: 'top', horizontal: 'right' },
};

// included so we can later move assets to a CDN if needed
export const assetUrl = (assetPath) => `/static/${assetPath}`;
