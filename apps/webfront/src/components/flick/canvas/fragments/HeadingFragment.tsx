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

import { HeadingBlockProps } from 'editor/src/utils/types'
import Konva from 'konva'
import React, { useEffect, useRef, useState } from 'react'
import { Group, Text } from 'react-konva'
import { useRecoilValue, useSetRecoilState } from 'recoil'
import {
	agoraUsersAtom,
	brandingAtom,
	controlsConfigAtom,
	payloadFamily,
	themeAtom,
} from 'src/stores/studio.store'
import {
	getFragmentLayoutConfig,
	ObjectConfig,
} from 'src/utils/canvasConfigs/fragmentLayoutConfig'
import {
	getShortsStudioUserConfiguration,
	getStudioUserConfiguration,
} from 'src/utils/canvasConfigs/studioUserConfig'
import {
	getThemeLayoutConfig,
	ObjectRenderConfig,
} from 'src/utils/canvasConfigs/themeConfig'
import { FragmentState } from 'src/utils/configs'
import useUpdatePayload from 'src/utils/hooks/useUpdatePayload'
import { BlockProperties, Layout } from 'utils/src'
import Concourse from '../Concourse'
import FragmentBackground from '../FragmentBackground'

const HeadingFragment = ({
	dataConfig,
	viewConfig,
	fragmentState,
	setFragmentState,
	stageRef,
	shortsMode,
	isPreview,
	speakersLength,
}: {
	dataConfig: HeadingBlockProps
	viewConfig: BlockProperties
	fragmentState: FragmentState
	setFragmentState: React.Dispatch<React.SetStateAction<FragmentState>>
	stageRef: React.RefObject<Konva.Stage>
	shortsMode: boolean
	isPreview: boolean
	speakersLength: number
}) => {
	const users = useRecoilValue(agoraUsersAtom)
	const theme = useRecoilValue(themeAtom)
	const branding = useRecoilValue(brandingAtom)
	const payload = useRecoilValue(payloadFamily(dataConfig.id))
	const { updatePayload, reset } = useUpdatePayload({
		blockId: dataConfig.id,
		shouldUpdateLiveblocks: !isPreview,
	})
	const setControlsConfig = useSetRecoilState(controlsConfigAtom)

	const [title, setTitle] = useState('')

	// ref to the object grp
	const customLayoutRef = useRef<Konva.Group>(null)

	const [layout, setLayout] = useState<Layout | undefined>(viewConfig?.layout)

	const [objectConfig, setObjectConfig] = useState<ObjectConfig>({
		x: 0,
		y: 0,
		width: 0,
		height: 0,
		borderRadius: 0,
	})

	const [objectRenderConfig, setObjectRenderConfig] =
		useState<ObjectRenderConfig>({
			startX: 0,
			startY: 0,
			availableWidth: 0,
			availableHeight: 0,
			textColor: '',
			surfaceColor: '',
		})

	useEffect(() => {
		if (!reset) return
		setControlsConfig({
			updatePayload,
			blockId: dataConfig.id,
		})
		// eslint-disable-next-line consistent-return
		return () => {
			reset({
				fragmentState: 'customLayout',
			})
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	useEffect(() => {
		if (!dataConfig) return
		setObjectConfig(
			getFragmentLayoutConfig({
				theme,
				layout: !isPreview
					? layout || viewConfig?.layout || 'classic'
					: viewConfig?.layout || 'classic',
				isShorts: shortsMode || false,
			})
		)
		if (dataConfig?.title) setTitle(dataConfig?.title || '')
	}, [dataConfig, shortsMode, viewConfig, theme, layout, isPreview])

	useEffect(() => {
		setObjectRenderConfig(
			getThemeLayoutConfig({ theme, layoutConfig: objectConfig })
		)
	}, [objectConfig, theme])

	useEffect(() => {
		// Checking if the current state is only fragment group and making the opacity of the only fragment group 1
		if (payload.fragmentState === 'customLayout') {
			if (!shortsMode) {
				setTimeout(() => {
					setLayout(viewConfig?.layout || 'classic')
					setFragmentState('customLayout')
					customLayoutRef?.current?.to({
						opacity: 1,
						duration: 0.1,
					})
				}, 400)
			} else {
				setLayout(viewConfig?.layout || 'classic')
				setFragmentState(payload?.fragmentState)
				customLayoutRef?.current?.to({
					opacity: 1,
					duration: 0.1,
				})
			}
		}
		// Checking if the current state is only usermedia group and making the opacity of the only fragment group 0
		if (payload?.fragmentState === 'onlyUserMedia') {
			if (!shortsMode)
				setTimeout(() => {
					setFragmentState('onlyUserMedia')
					customLayoutRef?.current?.to({
						opacity: 0,
						duration: 0.1,
					})
				}, 400)
			else {
				setFragmentState(payload?.fragmentState)
				customLayoutRef?.current?.to({
					opacity: 0,
					duration: 0.1,
				})
			}
		}
		if (payload?.fragmentState === 'onlyFragment') {
			if (!shortsMode)
				setTimeout(() => {
					setLayout('classic')
					setFragmentState('onlyFragment')
					customLayoutRef?.current?.to({
						opacity: 1,
						duration: 0.1,
					})
				}, 400)
			else {
				setLayout('classic')
				setFragmentState(payload?.fragmentState)
				customLayoutRef?.current?.to({
					opacity: 1,
					duration: 0.1,
				})
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [payload?.fragmentState])

	// useEffect(() => {
	// 	if (fragment?.configuration?.continuousRecording) {
	// 		if (
	// 			payload?.fragmentState === 'customLayout' ||
	// 			payload?.fragmentState === 'onlyFragment'
	// 		) {
	// 			setLayout(viewConfig?.layout || 'classic')
	// 			customLayoutRef?.current?.to({
	// 				opacity: 1,
	// 			})
	// 		}
	// 	}
	// }, [])

	const layerChildren: any[] = [
		<Group x={0} y={0} opacity={1} ref={customLayoutRef}>
			<FragmentBackground
				theme={theme}
				objectConfig={objectConfig}
				backgroundRectColor={
					branding?.colors?.primary
						? branding?.colors?.primary
						: objectRenderConfig.surfaceColor
				}
			/>
			<Group
				x={objectRenderConfig.startX}
				y={objectRenderConfig.startY}
				key='group1'
			>
				<Text
					x={10}
					fontSize={32}
					fill={
						branding?.colors?.text
							? branding?.colors?.text
							: objectRenderConfig.textColor
					}
					width={objectRenderConfig.availableWidth - 20}
					height={objectRenderConfig.availableHeight}
					text={title}
					fontStyle='bold'
					fontFamily={
						branding?.font?.body?.family ||
						objectRenderConfig.titleFont ||
						'Gilroy'
					}
					align='center'
					verticalAlign='middle'
					lineHeight={1.3}
					textTransform='capitalize'
				/>
			</Group>
		</Group>,
	]

	const studioUserConfig = !shortsMode
		? getStudioUserConfiguration({
				layout: !isPreview
					? layout || 'classic'
					: viewConfig?.layout || 'classic',
				noOfParticipants: !isPreview
					? (users?.length || 0) + 1
					: speakersLength,
				fragmentState,
				theme,
		  })
		: getShortsStudioUserConfiguration({
				layout: !isPreview
					? layout || 'classic'
					: viewConfig?.layout || 'classic',
				noOfParticipants: !isPreview
					? (users?.length || 0) + 1
					: speakersLength,
				fragmentState,
				theme,
		  })

	return (
		<Concourse
			layerChildren={layerChildren}
			viewConfig={viewConfig}
			stageRef={stageRef}
			studioUserConfig={studioUserConfig}
			isShorts={shortsMode}
			blockType={dataConfig.type}
			fragmentState={fragmentState}
			speakersLength={speakersLength}
		/>
	)
}

export default HeadingFragment
