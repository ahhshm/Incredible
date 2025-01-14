// Copyright (c) 2022 Pixelbyte Studio Pvt Ltd
//
// This file is part of Incredible, Pixelbyte Studio Pvt Ltd
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program\.  If not, see <http://www\.gnu\.org/licenses/>\.

/* eslint-disable react-hooks/exhaustive-deps */
import Konva from 'konva'
import React, { useEffect, useState } from 'react'
import { Arc, Circle, Group, Image, Rect, Ring, Text } from 'react-konva'
import { useRecoilValue, useSetRecoilState } from 'recoil'
import useImage from 'use-image'
import useEdit from 'icanvas/src/hooks/useEdit'
import { Video } from 'icanvas/src/Video'
import {
	brandingAtom,
	controlsConfigAtom,
	payloadFamily,
	studioStateAtom,
	themeAtom,
} from 'src/stores/studio.store'
import {
	getThemeSurfaceColor,
	getThemeTextColor,
	getThemeFont,
} from 'src/utils/canvasConfigs/themeConfig'
import { CONFIG, SHORTS_CONFIG, SocialHandles } from 'src/utils/configs'
import {
	BlockProperties,
	OutroState,
	OutroBlockViewProps,
	OutroBlockView,
	useEnv,
} from 'utils/src'
import useUpdatePayload from 'src/utils/hooks/useUpdatePayload'
import {
	getStudioUserConfiguration,
	getShortsStudioUserConfiguration,
} from 'src/utils/canvasConfigs/studioUserConfig'
import {
	getOutroConfig,
	getSocialHandlePositions,
	OutroConfig,
} from 'src/utils/canvasConfigs/outroConfig'
import FragmentBackground from '../FragmentBackground'
import Concourse from '../Concourse'
import WebsiteLogo from '../../../../../svg/OutroFragment/website.svg'
import LinkedInLogo from '../../../../../svg/OutroFragment/linkedin.svg'
import YoutubeLogo from '../../../../../svg/OutroFragment/youtube.svg'
import TwitterLogo from '../../../../../svg/OutroFragment/twitter.svg'
import DiscordLogo from '../../../../../svg/OutroFragment/discord.svg'

const OutroFragment = ({
	isShorts,
	viewConfig,
	isPreview,
	outroSequence,
	blockId,
}: {
	isShorts: boolean
	viewConfig: BlockProperties
	isPreview: boolean
	outroSequence: OutroState[]
	blockId: string
}) => {
	const state = useRecoilValue(studioStateAtom)
	const theme = useRecoilValue(themeAtom)
	const branding = useRecoilValue(brandingAtom)
	const payload = useRecoilValue(payloadFamily(blockId))
	const { updatePayload, reset } = useUpdatePayload({
		blockId,
		shouldUpdateLiveblocks: !isPreview,
	})
	const setControlsConfig = useSetRecoilState(controlsConfigAtom)
	const { storage } = useEnv()

	const [logo] = useImage(branding?.logo || '', 'anonymous')
	const [twitterLogo] = useImage(TwitterLogo, 'anonymous')
	const [discordLogo] = useImage(DiscordLogo, 'anonymous')
	const [youtubeLogo] = useImage(YoutubeLogo, 'anonymous')
	const [linkedinLogo] = useImage(LinkedInLogo, 'anonymous')
	const [websiteLogo] = useImage(WebsiteLogo, 'anonymous')

	const [outroConfig, setOutroConfig] = useState<OutroConfig>()
	const [outroMsg, setOutroMsg] = useState<string>()
	const [socialHandles, setSocialHandles] = useState<SocialHandles>({})
	// const [outroLayout, setOutroLayout] = useState<OutroLayout>()

	const [socialHandlesPositionInfo, setSocialHandlesPositionInfo] = useState({
		twitterX: 0,
		twitterY: 0,
		discordX: 0,
		discordY: 0,
		youtubeX: 0,
		youtubeY: 0,
		linkedinX: 0,
		linkedinY: 0,
		websiteX: 0,
		websiteY: 0,
	})

	const { clipRect } = useEdit()

	const outroScreenRef = React.useRef<Konva.Group>(null)
	const brandVideoRef = React.useRef<Konva.Group>(null)

	const [star] = useImage(
		`${storage.cdn}themes/DevsForUkraine/star.svg`,
		'anonymous'
	)
	const [heart] = useImage(
		`${storage.cdn}themes/DevsForUkraine/heart.svg`,
		'anonymous'
	)

	const [pantherBg] = useImage(
		`${storage.cdn}themes/Obsidian/ObsidianBg.svg`,
		'anonymous'
	)

	useEffect(() => {
		if (!reset) return
		setControlsConfig({
			updatePayload,
			blockId,
		})
		updatePayload({
			activeOutroIndex: 0,
		})
		// eslint-disable-next-line consistent-return
		return () => {
			reset({
				activeOutroIndex: 0,
			})
		}
	}, [])

	useEffect(() => {
		if (!viewConfig) return
		const outroBlockViewProps: OutroBlockViewProps = (
			viewConfig?.view as OutroBlockView
		)?.outro
		// setOutroLayout(outroBlockViewProps?.layout)
		setOutroConfig(
			getOutroConfig({
				theme,
				layout: viewConfig?.layout || 'classic',
				isShorts,
			})
		)
		setOutroMsg(outroBlockViewProps?.title || 'Thanks for watching')
		setSocialHandles(
			{
				twitterHandle:
					outroBlockViewProps?.twitter?.enabled &&
					outroBlockViewProps?.twitter?.handle !== ''
						? outroBlockViewProps?.twitter.handle
						: undefined,
				discordHandle:
					outroBlockViewProps?.discord?.enabled &&
					outroBlockViewProps?.discord?.handle !== ''
						? outroBlockViewProps?.discord.handle
						: undefined,
				youtubeHandle:
					outroBlockViewProps?.youtube?.enabled &&
					outroBlockViewProps?.youtube?.handle !== ''
						? outroBlockViewProps?.youtube.handle
						: undefined,
				linkedinHandle:
					outroBlockViewProps?.linkedin?.enabled &&
					outroBlockViewProps?.linkedin?.handle !== ''
						? outroBlockViewProps?.linkedin.handle
						: undefined,
				websiteHandle:
					outroBlockViewProps?.website?.enabled &&
					outroBlockViewProps?.website?.handle !== ''
						? outroBlockViewProps?.website.handle
						: undefined,
			} || {}
		)
	}, [viewConfig, theme, isShorts])

	useEffect(() => {
		if (!outroConfig) return
		const outroBlockViewProps: OutroBlockViewProps = (
			viewConfig?.view as OutroBlockView
		)?.outro
		setSocialHandlesPositionInfo(
			getSocialHandlePositions({
				layout: viewConfig?.layout || 'classic',
				socialHandles:
					{
						twitterHandle:
							outroBlockViewProps?.twitter?.enabled &&
							outroBlockViewProps?.twitter?.handle !== ''
								? outroBlockViewProps?.twitter.handle
								: undefined,
						discordHandle:
							outroBlockViewProps?.discord?.enabled &&
							outroBlockViewProps?.discord?.handle !== ''
								? outroBlockViewProps?.discord.handle
								: undefined,
						youtubeHandle:
							outroBlockViewProps?.youtube?.enabled &&
							outroBlockViewProps?.youtube?.handle !== ''
								? outroBlockViewProps?.youtube.handle
								: undefined,
						linkedinHandle:
							outroBlockViewProps?.linkedin?.enabled &&
							outroBlockViewProps?.linkedin?.handle !== ''
								? outroBlockViewProps?.linkedin.handle
								: undefined,
						websiteHandle:
							outroBlockViewProps?.website?.enabled &&
							outroBlockViewProps?.website?.handle !== ''
								? outroBlockViewProps?.website.handle
								: undefined,
					} || {},
				isShorts,
				noOfSocialHandles: outroBlockViewProps?.noOfSocialHandles || 3,
				textProperties: {
					textFontSize: 16,
					textFontFamily: branding?.font?.body?.family || 'GilroyRegular',
					// textFontStyle: 'normal',
				},
				availableWidth: outroConfig?.layoutWidth || 0,
				availableHeight: outroConfig?.layoutHeight || 0,
				socialX: outroConfig?.socialX || 0,
				socialY: outroConfig?.socialY || 0,
			})
		)
	}, [outroConfig, viewConfig, socialHandles, isShorts])

	const videoElement = React.useMemo(() => {
		if (!branding?.introVideoUrl) return
		const element = document.createElement('video')
		element.autoplay = false
		element.crossOrigin = 'anonymous'
		element.preload = 'auto'
		element.muted = true
		element.src = branding?.outroVideoUrl || ''
		// eslint-disable-next-line consistent-return
		return element
	}, [branding])

	useEffect(() => {
		if (payload?.activeOutroIndex === undefined) return
		if (
			state === 'startRecording' ||
			state === 'recording' ||
			state === 'ready' ||
			state === 'resumed' ||
			isPreview
		) {
			if (outroSequence[payload?.activeOutroIndex] === 'titleSplash') {
				videoElement?.pause()
				if (videoElement) videoElement.currentTime = 0
				outroScreenRef.current?.opacity(1)
				brandVideoRef.current?.opacity(0)
			}
			if (outroSequence[payload?.activeOutroIndex] === 'outroVideo') {
				if (!videoElement) return
				if (videoElement) videoElement.currentTime = 0
				videoElement?.play()
				outroScreenRef.current?.opacity(0)
				brandVideoRef.current?.opacity(1)
			}
		}
	}, [state, payload?.activeOutroIndex, videoElement])

	useEffect(() => {
		if (!videoElement) return
		if (isPreview) return
		if (payload?.activeOutroIndex === undefined) return
		if (outroSequence[payload?.activeOutroIndex] !== 'outroVideo') return
		videoElement.addEventListener('ended', () => {
			if (payload?.activeOutroIndex !== outroSequence.length - 1) {
				updatePayload?.({
					activeOutroIndex: (payload?.activeOutroIndex || 0) + 1,
				})
			} else {
				videoElement.pause()
			}
		})
	}, [videoElement, payload?.activeOutroIndex])

	const layerChildren = [
		<Group>
			{theme.name === 'DevsForUkraine' && !isShorts && (
				<Rect
					x={0}
					y={0}
					width={CONFIG.width}
					height={CONFIG.height}
					fill='#1C1C1C'
				/>
			)}
			{theme.name === 'Obsidian' && (
				<Group>
					<Image
						x={0}
						y={0}
						image={pantherBg}
						width={CONFIG.width}
						height={CONFIG.height}
					/>
					<Rect
						x={
							viewConfig?.layout === 'classic'
								? 216
								: (outroConfig?.layoutX || 0) + (outroConfig?.textX || 0)
						}
						y={
							viewConfig?.layout === 'classic'
								? 295
								: (outroConfig?.layoutY || 0) +
								  (outroConfig?.textY || 0) +
								  (outroConfig?.textHeight || 0)
						}
						width={
							viewConfig?.layout === 'classic'
								? 540
								: outroConfig?.layoutWidth || 0
						}
						height={5}
						fillLinearGradientColorStops={[0, '#F11012', 1, '#FFB626']}
						fillLinearGradientStartPoint={{ x: 0, y: 0 }}
						fillLinearGradientEndPoint={{
							x:
								viewConfig?.layout === 'classic'
									? 540
									: outroConfig?.layoutWidth || 0,
							y: 0,
						}}
					/>
				</Group>
			)}
			<Group
				x={0}
				y={0}
				ref={outroScreenRef}
				opacity={0}
				clipFunc={(ctx: any) => {
					clipRect(ctx, {
						x: outroConfig?.layoutX || 0,
						y: outroConfig?.layoutY || 0,
						width: outroConfig?.layoutWidth || 0,
						height: outroConfig?.layoutHeight || 0,
						borderRadius: outroConfig?.layoutBorderRadius || 0,
					})
				}}
			>
				<FragmentBackground
					theme={theme}
					objectConfig={{
						x: outroConfig?.layoutX || 0,
						y: outroConfig?.layoutY || 0,
						width: outroConfig?.layoutWidth || 0,
						height: outroConfig?.layoutHeight || 0,
						borderRadius: outroConfig?.layoutBorderRadius || 0,
					}}
					backgroundRectColor={
						branding?.colors?.primary
							? branding?.colors?.primary
							: getThemeSurfaceColor(theme)
					}
				/>
				{theme.name === 'DevsForUkraine' &&
					viewConfig?.layout === 'classic' &&
					!isShorts && (
						<>
							<Group x={92} y={230}>
								<Ring innerRadius={22} outerRadius={30} fill='#fafafa' />
								<Circle x={123} radius={34} fill='#2696FA' />
								<Rect x={25} y={-4} width={98} height={8} fill='#fafafa' />
							</Group>
							<Group x={745} y={230}>
								<Arc
									innerRadius={22}
									outerRadius={30}
									angle={180}
									fill='#ffe87b'
									rotation={90}
								/>
								<Rect x={-4} y={-30} width={8} height={60} fill='#ffe87b' />
								<Rect x={25} y={8} width={64} height={8} fill='#fafafa' />
							</Group>
							<Group x={745} y={313}>
								<Circle radius={32} fill='#e2ce68' />
								<Arc
									x={64}
									innerRadius={0}
									outerRadius={32}
									angle={180}
									fill='#2696FA'
									rotation={90}
								/>
							</Group>
							<Image x={240} y={317} image={star} width={40} height={42} />
							<Image
								x={CONFIG.width / 2 - 28}
								y={72}
								image={heart}
								width={56}
								height={56}
							/>
						</>
					)}
				{theme.name === 'DevsForUkraine' &&
					(viewConfig?.layout === 'float-full-right' ||
						viewConfig?.layout === 'split-without-media') && (
						<>
							<Group x={30} y={75}>
								<Ring innerRadius={22} outerRadius={30} fill='#fafafa' />
								<Circle x={123} radius={34} fill='#2696FA' />
								<Rect x={25} y={-4} width={98} height={8} fill='#fafafa' />
							</Group>
							<Group x={450} y={230}>
								<Arc
									innerRadius={22}
									outerRadius={30}
									angle={180}
									fill='#ffe87b'
									rotation={90}
								/>
								<Rect x={-4} y={-30} width={8} height={60} fill='#ffe87b' />
								<Rect x={25} y={8} width={64} height={8} fill='#fafafa' />
							</Group>
							<Group x={450} y={308}>
								<Circle radius={32} fill='#e2ce68' />
								<Arc
									x={64}
									innerRadius={0}
									outerRadius={32}
									angle={180}
									fill='#2696FA'
									rotation={90}
								/>
							</Group>
							<Image x={18} y={330} image={star} width={40} height={42} />
							<Image x={320} y={442} image={heart} width={32} height={32} />
						</>
					)}
				<Group x={outroConfig?.layoutX} y={outroConfig?.layoutY}>
					<Text
						x={outroConfig?.textX || 16}
						y={outroConfig?.textY || 0}
						width={outroConfig?.textWidth || 0}
						height={outroConfig?.textHeight || 0}
						text={outroMsg}
						align={
							outroConfig?.textAlign ||
							(viewConfig?.layout !== 'classic' ? 'left' : 'center') ||
							'center'
						}
						fill={branding?.colors?.text || getThemeTextColor(theme)}
						fontSize={outroConfig?.textFontSize || 0}
						fontFamily={getThemeFont(theme)}
						fontStyle={outroConfig?.textFontStyle || 'normal 600'}
						lineHeight={1.1}
					/>
					{theme.name !== 'DevsForUkraine' && (
						<Image
							x={outroConfig?.logoX || 0}
							y={outroConfig?.logoY || 0}
							width={outroConfig?.logoWidth || 0}
							height={outroConfig?.logoHeight || 0}
							image={logo}
						/>
					)}
					{socialHandles?.twitterHandle && (
						<>
							<Image
								x={socialHandlesPositionInfo?.twitterX}
								y={socialHandlesPositionInfo?.twitterY || 0}
								width={24}
								height={24}
								image={twitterLogo}
							/>
							<Text
								x={socialHandlesPositionInfo.twitterX + 8 + 24}
								y={socialHandlesPositionInfo.twitterY + 3}
								text={socialHandles?.twitterHandle}
								fill={branding?.colors?.text || getThemeTextColor(theme)}
								fontSize={outroConfig?.socialHandlesFontSize || 0}
								fontFamily={branding?.font?.body?.family || 'GilroyRegular'}
							/>
						</>
					)}
					{socialHandles?.discordHandle && (
						<>
							<Image
								x={socialHandlesPositionInfo?.discordX}
								y={socialHandlesPositionInfo?.discordY || 0}
								width={24}
								height={24}
								image={discordLogo}
							/>
							<Text
								x={socialHandlesPositionInfo.discordX + 8 + 24}
								y={socialHandlesPositionInfo.discordY + 3}
								text={socialHandles?.discordHandle}
								fill={branding?.colors?.text || getThemeTextColor(theme)}
								fontSize={outroConfig?.socialHandlesFontSize || 0}
								fontFamily={branding?.font?.body?.family || 'GilroyRegular'}
								lineHeight={1.2}
							/>
						</>
					)}
					{socialHandles?.youtubeHandle && (
						<>
							<Image
								x={socialHandlesPositionInfo?.youtubeX}
								y={socialHandlesPositionInfo?.youtubeY || 0}
								width={24}
								height={24}
								image={youtubeLogo}
							/>
							<Text
								x={socialHandlesPositionInfo.youtubeX + 8 + 24}
								y={socialHandlesPositionInfo.youtubeY + 3}
								text={socialHandles?.youtubeHandle}
								fill={branding?.colors?.text || getThemeTextColor(theme)}
								fontSize={outroConfig?.socialHandlesFontSize || 0}
								fontFamily={branding?.font?.body?.family || 'GilroyRegular'}
								lineHeight={1.2}
							/>
						</>
					)}
					{socialHandles?.linkedinHandle && (
						<>
							<Image
								x={socialHandlesPositionInfo?.linkedinX}
								y={socialHandlesPositionInfo?.linkedinY || 0}
								width={24}
								height={24}
								image={linkedinLogo}
							/>
							<Text
								x={socialHandlesPositionInfo.linkedinX + 8 + 24}
								y={socialHandlesPositionInfo.linkedinY + 3}
								text={socialHandles?.linkedinHandle}
								fill={branding?.colors?.text || getThemeTextColor(theme)}
								fontSize={outroConfig?.socialHandlesFontSize || 0}
								fontFamily={branding?.font?.body?.family || 'GilroyRegular'}
								lineHeight={1.2}
							/>
						</>
					)}
					{socialHandles?.websiteHandle && (
						<>
							<Image
								x={socialHandlesPositionInfo?.websiteX}
								y={socialHandlesPositionInfo?.websiteY || 0}
								width={24}
								height={24}
								image={websiteLogo}
							/>
							<Text
								x={socialHandlesPositionInfo.websiteX + 8 + 24}
								y={socialHandlesPositionInfo.websiteY + 3}
								text={socialHandles?.websiteHandle}
								fill={branding?.colors?.text || getThemeTextColor(theme)}
								fontSize={outroConfig?.socialHandlesFontSize || 0}
								fontFamily={branding?.font?.body?.family || 'GilroyRegular'}
								lineHeight={1.2}
							/>
						</>
					)}
				</Group>
			</Group>
			<Group x={0} y={0} ref={brandVideoRef} opacity={0}>
				{videoElement && (
					<Video
						videoElement={videoElement}
						videoConfig={{
							x: 0,
							y: 0,
							width: !isShorts ? CONFIG.width : SHORTS_CONFIG.width,
							height: !isShorts ? CONFIG.height : SHORTS_CONFIG.height,
							videoFill: branding?.background?.color?.primary,
							cornerRadius: 0,
							performClip: true,
							clipVideoConfig: {
								x: 0,
								y: 0,
								width: 1,
								height: 1,
							},
						}}
					/>
				)}
			</Group>
		</Group>,
	]

	const studioUserConfig = !isShorts
		? getStudioUserConfiguration({
				layout:
					outroSequence[payload?.activeOutroIndex || 0] === 'titleSplash'
						? outroConfig?.userMediaLayout || 'classic'
						: 'classic',
				noOfParticipants: 1,
				fragmentState: 'customLayout',
				theme,
		  })
		: getShortsStudioUserConfiguration({
				layout:
					outroSequence[payload?.activeOutroIndex || 0] === 'titleSplash'
						? outroConfig?.userMediaLayout || 'classic'
						: 'classic',
				noOfParticipants: 1,
				fragmentState: 'customLayout',
				theme,
		  })

	return (
		<Concourse
			layerChildren={layerChildren}
			blockType='outroBlock'
			studioUserConfig={studioUserConfig}
			isShorts={isShorts}
			speakersLength={1}
		/>
	)
}

export default OutroFragment
