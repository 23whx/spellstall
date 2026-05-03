const isDirectImageUrl = (url: string) =>
  /^https?:\/\//.test(url) && /\.(png|jpe?g|webp|gif)(\?|$)/i.test(url);

export const getPublicSampleImages = (urls: string[] | null | undefined) =>
  (urls ?? []).filter(isDirectImageUrl).slice(0, 4);
