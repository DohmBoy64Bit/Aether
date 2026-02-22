import { useState, useEffect, useRef } from "react";
import api from "@/utils/api";

function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

export function useMediaComposer(initialContent = "") {
    const [content, setContent] = useState(initialContent);
    const [mediaImages, setMediaImages] = useState<string[]>([]);
    const [linkPreview, setLinkPreview] = useState<any>(null);
    const [videoEmbed, setVideoEmbed] = useState<any>(null);
    const [isUploading, setIsUploading] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const fetchedUrls = useRef<Set<string>>(new Set());
    const debouncedContent = useDebounce(content, 500);

    useEffect(() => {
        if (mediaImages.length > 0 || videoEmbed) return; // Don't fetch if other media is attached

        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const matches = content.match(urlRegex);

        if (matches && matches.length > 0) {
            const url = matches[0];

            // Check for YouTube/Dailymotion for video embed first
            if (url.includes("youtube.com") || url.includes("youtu.be")) {
                let videoId = null;
                if (url.includes("v=")) videoId = url.split("v=")[1]?.split("&")[0];
                else if (url.includes("youtu.be/")) videoId = url.split("youtu.be/")[1]?.split("?")[0];

                if (videoId) {
                    if (fetchedUrls.current.has(url)) return;
                    fetchedUrls.current.add(url);

                    api.get(`/media/preview?url=${encodeURIComponent(url)}`)
                        .then(res => {
                            setVideoEmbed({
                                url,
                                iframe_src: `https://www.youtube.com/embed/${videoId}`,
                                title: res.data.title || "YouTube Video",
                                thumbnail: res.data.image
                            });
                            setLinkPreview(null);
                        })
                        .catch(() => {
                            setVideoEmbed({
                                url,
                                iframe_src: `https://www.youtube.com/embed/${videoId}`,
                                title: "YouTube Video"
                            });
                            setLinkPreview(null);
                        });
                    return;
                }
            }

            // Check for direct image URLs
            if (url.match(/\.(jpeg|jpg|gif|png|webp)$/i)) {
                if (!mediaImages.includes(url)) {
                    setMediaImages(prev => [...prev, url].slice(0, 4));
                    setLinkPreview(null);
                    setVideoEmbed(null);
                }
                return;
            }

            // Otherwise fetch link preview
            if (!linkPreview || linkPreview.url !== url) {
                if (!fetchedUrls.current.has(url)) {
                    fetchedUrls.current.add(url);
                    api.get(`/media/preview?url=${encodeURIComponent(url)}`)
                        .then(res => setLinkPreview(res.data))
                        .catch(() => { });
                }
            }
        } else {
            setLinkPreview(null);
            setVideoEmbed(null);
        }
    }, [debouncedContent, mediaImages.length, videoEmbed, linkPreview]);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        setIsUploading(true);
        const file = e.target.files[0];
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await api.post("/media/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            setMediaImages(prev => [...prev, res.data.url].slice(0, 4));
            setLinkPreview(null);
            setVideoEmbed(null);
        } catch (err) {
            console.error("Upload failed", err);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const removeMedia = () => {
        setMediaImages([]);
        setLinkPreview(null);
        setVideoEmbed(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const clearComposer = () => {
        setContent("");
        setMediaImages([]);
        setLinkPreview(null);
        setVideoEmbed(null);
    };

    const getMediaPayload = () => {
        if (mediaImages.length > 0) {
            return { images: mediaImages.map(url => ({ url })) };
        } else if (videoEmbed) {
            return { video: videoEmbed };
        } else if (linkPreview) {
            return { links: [{ ...linkPreview, thumbnail: linkPreview.image }] };
        }
        return null;
    };

    const canPost = Boolean(content.trim() || mediaImages.length > 0);

    return {
        content, setContent,
        mediaImages, linkPreview, videoEmbed,
        isUploading, fileInputRef,
        handleImageUpload, removeMedia, clearComposer, getMediaPayload, canPost
    };
}
