"use client";

/**
 * Assam Flood Relief Announcement
 *
 * HOW TO ADD YOUR MEDIA
 * ---------------------
 * 1. Drop your images into  /public/flood-relief/   (jpg, png, webp)
 * 2. Drop your video into   /public/flood-relief/   (mp4 preferred)
 * 3. Edit the MEDIA array below to match your filenames.
 *
 * Each entry is either:
 *   { type: "image", src: "/flood-relief/your-file.jpg", alt: "description" }
 *   { type: "video", src: "/flood-relief/your-file.mp4" }
 *
 * Leave the array empty ([]) to hide the media section until you're ready.
 */

const MEDIA: Array<
  | { type: "image"; src: string; alt: string }
  | { type: "video"; src: string }
> = [
  { type: "image", src: "/flood-relief/Distributing-Relief.jpeg", alt: "Handing relief supplies directly to flood-affected families" },
  { type: "image", src: "/flood-relief/Loaded-Truck.jpeg",        alt: "Truck loaded with essential supplies for flood relief" },
];

// ---------------------------------------------------------------------------

import { useEffect, useRef, useState } from "react";
import { X, Heart, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";

import Link from "next/link";

const MODAL_KEY = "xv-assam-modal-dismissed";

export default function AnnouncementBar() {
  const [modalOpen, setModalOpen] = useState(false);
  const [mediaIndex, setMediaIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Auto-open modal on first visit
  useEffect(() => {
    const alreadySeen = localStorage.getItem(MODAL_KEY);
    if (!alreadySeen) {
      const t = setTimeout(() => setModalOpen(true), 900);
      return () => clearTimeout(t);
    }
  }, []);

  // Pause video when navigating away from it
  useEffect(() => {
    if (videoRef.current) videoRef.current.pause();
  }, [mediaIndex]);

  function closeModal() {
    localStorage.setItem(MODAL_KEY, "1");
    setModalOpen(false);
  }

  function prev() {
    setMediaIndex((i) => (i - 1 + MEDIA.length) % MEDIA.length);
  }

  function next() {
    setMediaIndex((i) => (i + 1) % MEDIA.length);
  }

  const currentMedia = MEDIA[mediaIndex] ?? null;

  return (
    <>
      {/* ── Modal ─────────────────────────────────────────────────────────── */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Assam Flood Relief"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeModal}
          />

          {/* Card */}
          <div className="relative z-10 bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">

            {/* Close button */}
            <button
              onClick={closeModal}
              aria-label="Close"
              className="absolute top-4 right-4 z-20 p-1.5 rounded-full bg-black/10 hover:bg-black/20 transition-colors"
            >
              <X size={15} className="text-white" />
            </button>

            {/* ── Media section ──────────────────────────────────────────── */}
            {MEDIA.length > 0 ? (
              <div className="relative bg-stone-900 aspect-video overflow-hidden">
                {currentMedia?.type === "image" && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={currentMedia.src}
                    alt={currentMedia.alt}
                    className="w-full h-full object-cover"
                  />
                )}
                {currentMedia?.type === "video" && (
                  <video
                    ref={videoRef}
                    src={currentMedia.src}
                    controls
                    playsInline
                    className="w-full h-full object-cover"
                  />
                )}

                {/* Navigation arrows — only if multiple items */}
                {MEDIA.length > 1 && (
                  <>
                    <button
                      onClick={prev}
                      className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      onClick={next}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors"
                    >
                      <ChevronRight size={16} />
                    </button>

                    {/* Dot indicators */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {MEDIA.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setMediaIndex(i)}
                          className={`w-1.5 h-1.5 rounded-full transition-all ${
                            i === mediaIndex
                              ? "bg-white scale-125"
                              : "bg-white/50"
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : (
              /* Placeholder shown until media is added */
              <div className="bg-gradient-to-br from-[#1A0A3C] to-rose-900 aspect-video flex flex-col items-center justify-center gap-3">
                <Heart size={36} className="text-rose-300 fill-rose-300" />
                <p className="text-white/60 text-sm">Photos and videos coming soon</p>
              </div>
            )}

            {/* ── Text content ───────────────────────────────────────────── */}
            <div className="px-7 py-6">
              <div className="flex items-center gap-2 mb-3">
                <Heart size={14} className="text-rose-500 fill-rose-500 flex-shrink-0" />
                <span className="text-xs font-semibold text-rose-600 uppercase tracking-wider">
                  Assam Flood Relief
                </span>
              </div>

              <h2 className="text-[1.35rem] font-semibold text-[#1A0A3C] leading-snug mb-3">
                My home state is facing its worst flood in history
              </h2>

              <p className="text-sm text-stone-600 leading-relaxed mb-2">
                Over 200 lives lost. Thousands of families have lost their homes and livelihoods.
                Assam has never seen a disaster of this scale, and the official body count is still not in.
              </p>
              <p className="text-sm text-stone-600 leading-relaxed mb-5">
                I have already been on the ground helping over 200 families with supplies and support.
                I am not stopping. <span className="font-semibold text-[#1A0A3C]">90% of every Founder&apos;s Circle purchase goes directly toward this relief work</span>, carried out personally by me.
              </p>

              {/* CTA */}
              <Link
                href="/pricing#founder"
                onClick={closeModal}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold text-sm hover:brightness-110 transition-all"
              >
                Claim a Founder&apos;s Circle seat
                <ExternalLink size={13} />
              </Link>

              <button
                onClick={closeModal}
                className="w-full mt-3 py-2 text-xs text-stone-400 hover:text-stone-600 transition-colors"
              >
                Close for now
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
