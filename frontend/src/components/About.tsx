import React, { useState, useEffect } from "react";
import { invoke } from '@tauri-apps/api/core';
import { getVersion } from '@tauri-apps/api/app';
import Image from 'next/image';

const UNISSANT_URL = 'https://unissant.us';
const UNISSANT_CONTACT_URL = 'https://unissant.us/support/';
const UPSTREAM_URL = 'https://github.com/Zackriya-Solutions/meeting-minutes';

export function About() {
    const [currentVersion, setCurrentVersion] = useState<string>('0.4.0');

    useEffect(() => {
        getVersion().then(setCurrentVersion).catch(console.error);
    }, []);

    const openExternal = async (url: string) => {
        try {
            await invoke('open_external_url', { url });
        } catch (error) {
            console.error('Failed to open link:', error);
        }
    };

    return (
        <div className="p-4 space-y-4 h-[80vh] overflow-y-auto">
            {/* Compact Header */}
            <div className="text-center">
                <div className="mb-3">
                    <Image
                        src="icon_128x128.png"
                        alt="ULab Scribe Logo"
                        width={64}
                        height={64}
                        className="mx-auto"
                    />
                </div>
                <h1 className="text-xl font-bold text-gray-900">ULab Scribe</h1>
                <span className="text-sm text-gray-500"> v{currentVersion}</span>
                <p className="text-medium text-gray-600 mt-1">
                    Real-time notes and summaries that never leave your machine.
                </p>
            </div>

            {/* Features Grid - Compact */}
            <div className="space-y-3">
                <h2 className="text-base font-semibold text-gray-800">What makes ULab Scribe different</h2>
                <div className="grid grid-cols-2 gap-2">
                    <div className="bg-gray-50 rounded p-3 hover:bg-gray-100 transition-colors">
                        <h3 className="font-bold text-sm text-gray-900 mb-1">Privacy-first</h3>
                        <p className="text-xs text-gray-600 leading-relaxed">Your data and AI processing stay on your machine. No cloud, no telemetry, no leaks.</p>
                    </div>
                    <div className="bg-gray-50 rounded p-3 hover:bg-gray-100 transition-colors">
                        <h3 className="font-bold text-sm text-gray-900 mb-1">Use Any Model</h3>
                        <p className="text-xs text-gray-600 leading-relaxed">Prefer a local open-source model? Great. Want to plug in an external API? Also fine. No lock-in.</p>
                    </div>
                    <div className="bg-gray-50 rounded p-3 hover:bg-gray-100 transition-colors">
                        <h3 className="font-bold text-sm text-gray-900 mb-1">Cost-Smart</h3>
                        <p className="text-xs text-gray-600 leading-relaxed">Avoid pay-per-minute bills by running models locally (or pay only for the calls you choose).</p>
                    </div>
                    <div className="bg-gray-50 rounded p-3 hover:bg-gray-100 transition-colors">
                        <h3 className="font-bold text-sm text-gray-900 mb-1">Works everywhere</h3>
                        <p className="text-xs text-gray-600 leading-relaxed">Google Meet, Zoom, Teams — online or offline.</p>
                    </div>
                </div>
            </div>

            {/* Privacy note */}
            <div className="bg-blue-50 rounded p-3">
                <p className="text-s text-blue-800">
                    <span className="font-bold">No telemetry.</span> This build collects and transmits no usage
                    analytics of any kind. Transcription and summarisation run against the models you configure.
                </p>
            </div>

            {/* CTA Section - Compact */}
            <div className="text-center space-y-2">
                <h3 className="text-medium font-semibold text-gray-800">Built by Unissant ULab</h3>
                <p className="text-s text-gray-600">
                    ULab Scribe is developed by <span className="font-bold">Unissant</span> for mission teams that need
                    meeting intelligence without sending anything off the machine.
                </p>
                <div className="flex items-center justify-center gap-2 pt-1">
                    <button
                        onClick={() => openExternal(UNISSANT_URL)}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors duration-200 shadow-sm hover:shadow-md"
                    >
                        unissant.us
                    </button>
                    <button
                        onClick={() => openExternal(UNISSANT_CONTACT_URL)}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded transition-colors duration-200"
                    >
                        Contact Unissant
                    </button>
                </div>
            </div>

            {/* Attribution Footer */}
            <div className="pt-2 border-t border-gray-200 text-center space-y-1">
                <p className="text-xs text-gray-500">
                    Based on{' '}
                    <button
                        onClick={() => openExternal(UPSTREAM_URL)}
                        className="underline hover:text-gray-700"
                    >
                        Meetily
                    </button>
                    {' '}by Zackriya Solutions — MIT licensed.
                </p>
                <p className="text-xs text-gray-400">
                    Copyright (c) 2024 Zackriya Solutions. Modifications copyright (c) 2026 Unissant, Inc.
                </p>
            </div>
        </div>
    )
}
