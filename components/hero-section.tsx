"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

import { fadeInUp, staggerContainer } from "@/lib/motion";
import { siteConfig } from "@/lib/site-config";

const videos = [
  {
    src: "https://player.vimeo.com/external/434045526.sd.mp4?s=6d484d25cf14f7d8baeb1fed909749d16f285194&profile_id=139&oauth2_token_id=57447761",
    label: "Pickle preparation",
  },
  {
    src: "https://player.vimeo.com/external/434045540.sd.mp4?s=6ca0c4fd6f77b8c65bfe6430e75068d90f196c35&profile_id=139&oauth2_token_id=57447761",
    label: "Spices grinding",
  },
  {
    src: "https://player.vimeo.com/external/371433846.sd.mp4?s=756bbcf7b4ad89c1c3cc596f0dd013d3a7481529&profile_id=139&oauth2_token_id=57447761",
    label: "Traditional cooking",
  },
];

export function HeroSection() {
  return (
    <section className="section-shell relative pt-4 sm:pt-6">
      <div className="relative overflow-hidden rounded-[2.5rem] border border-brand-red/10 bg-brand-red shadow-float">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(201,226,26,0.30),transparent_35%),linear-gradient(90deg,rgba(20,24,21,0.45),rgba(20,24,21,0.64))]" />
        <div className="absolute inset-0 bg-heritage-grid bg-[size:28px_28px] opacity-20" />

        <div className="grid min-h-[82vh] lg:grid-cols-[1.05fr_0.95fr]">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="relative z-10 flex flex-col justify-center px-6 py-14 sm:px-10 lg:px-16 lg:py-16"
          >
            <motion.div
              variants={fadeInUp}
              className="inline-flex w-fit items-center gap-2 self-start rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-brand-yellow"
            >
              <Sparkles className="h-4 w-4" />
              Small Batch Pantry
            </motion.div>
            <motion.div variants={fadeInUp} className="mt-5">
              <Image
                src="/brand/logo-full-color.png"
                alt="AahaFoods"
                width={796}
                height={241}
                className="h-10 w-auto sm:h-12"
              />
            </motion.div>
            <motion.h1
              variants={fadeInUp}
              className="mt-6 max-w-3xl font-heading text-4xl font-semibold leading-[1.08] text-white sm:text-5xl lg:text-6xl"
            >
              Authentic Homemade Flavors, Delivered with Love{" "}
              <span className="text-brand-yellow">❤️</span>
            </motion.h1>
            <motion.p
              variants={fadeInUp}
              className="mt-6 max-w-2xl text-base leading-8 text-white sm:text-lg"
            >
              Pickles matured with patience, spice powders ground fresh, and
              traditional recipes prepared with the richness of an Indian home
              kitchen.
            </motion.p>
            <motion.p
              variants={fadeInUp}
              className="mt-4 text-sm font-semibold tracking-[0.08em] text-white"
            >
              Orders and WhatsApp support: {siteConfig.phoneDisplay}
            </motion.p>
            <motion.div variants={fadeInUp} className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/products"
                className="inline-flex h-12 items-center justify-center rounded-full bg-brand-yellow px-6 text-sm font-semibold text-brand-red transition hover:bg-brand-yellow/90"
              >
                Shop Signature Range
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                href={siteConfig.whatsappLink}
                target="_blank"
                className="inline-flex h-12 items-center justify-center rounded-full border border-white/25 bg-white/10 px-6 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                Chat on WhatsApp
              </Link>
            </motion.div>
          </motion.div>

          <div className="relative grid grid-cols-2 gap-3 p-3 sm:grid-cols-3 sm:p-6">
            {videos.map((video, index) => (
              <motion.div
                key={video.label}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.12, duration: 0.7 }}
                className={`relative overflow-hidden rounded-[1.75rem] border border-white/15 bg-white/10 ${
                  index === 0 ? "col-span-2 row-span-2" : ""
                }`}
              >
                <video
                  className="h-full min-h-[220px] w-full object-cover"
                  autoPlay
                  muted
                  loop
                  playsInline
                  poster="/posters/hero-poster.svg"
                >
                  <source src={video.src} type="video/mp4" />
                </video>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                  <p className="text-sm font-medium text-white">{video.label}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
