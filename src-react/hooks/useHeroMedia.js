import { useEffect, useState } from "react";
import { DEFAULT_MEDIA } from "../constants/media";
import { resolveMedia } from "../lib/mediaDb";
import { fetchVideoSettings } from "../lib/api/settings";

export function useHeroMedia() {
  const [media, setMedia] = useState(DEFAULT_MEDIA);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const next = {
        coffee: { ...DEFAULT_MEDIA.coffee },
        nuts: { ...DEFAULT_MEDIA.nuts },
        spices: { ...DEFAULT_MEDIA.spices }
      };
      const poster = await resolveMedia("poster");
      if (poster) {
        next.coffee.poster = poster;
        next.nuts.poster = poster;
        next.spices.poster = poster;
      }
      for (const key of ["coffee", "nuts", "spices"]) {
        const local = await resolveMedia(key);
        if (local) {
          next[key].src = local;
        }
      }
      const settings = await fetchVideoSettings();
      settings.forEach((item) => {
        if (next[item.key]) {
          if (item.url && item.url.startsWith("http")) next[item.key].src = item.url;
          if (item.title) next[item.key].title = item.title;
          if (item.tag) next[item.key].tag = item.tag;
          if (item.description) next[item.key].description = item.description;

          if (item.key === "poster" && item.url) {
            next.coffee.poster = item.url;
            next.nuts.poster = item.url;
            next.spices.poster = item.url;
          }
        }
      });
      if (mounted) setMedia(next);
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  return media;
}
