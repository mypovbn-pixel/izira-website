import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "KADAI",
    short_name: "KADAI",
    description: "Buka kadai online, without the complicated stuff.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#fffaf5",
    theme_color: "#a8512d",
  };
}
