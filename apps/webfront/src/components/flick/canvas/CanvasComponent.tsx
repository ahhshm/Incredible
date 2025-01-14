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

import { Block, IntroBlockProps } from 'editor/src/utils/types'
import Konva from 'konva'
import React, {
	createContext,
	useContext,
	useEffect,
	useRef,
	useState,
} from 'react'
import { Group, Layer, Stage } from 'react-konva'
import { RectReadOnly } from 'react-use-measure'
import {
	useRecoilBridgeAcrossReactRoots_UNSTABLE,
	useRecoilValue,
} from 'recoil'
import { fragmentTypeAtom } from 'src/stores/flick.store'
import {
	studioStateAtom,
	themeAtom,
	transitionAtom,
} from 'src/stores/studio.store'
import { CONFIG, SHORTS_CONFIG } from 'src/utils/configs'
import { RoomContext, useRoom } from 'src/utils/liveblocks.config'
import { UserContext, useUser } from 'src/utils/providers/auth'
import { IntroBlockView, TopLayerChildren, ViewConfig } from 'utils/src'
import UnifiedFragment from './fragments/UnifiedFragment'
import GetTopLayerChildren from './GetTopLayerChildren'

export const StudioContext = createContext<{
	start: () => void
	stop: () => void
}>({
	start: () => {},
	stop: () => {},
})

export const getIntegerHW = ({
	maxH,
	maxW,
	aspectRatio,
	isShorts,
}: {
	maxH: number
	maxW: number
	aspectRatio: number
	isShorts: boolean
}) => {
	let calWidth = 0
	let calHeight = 0
	if (aspectRatio > maxW / maxH) {
		calWidth = Math.floor(maxW - (!isShorts ? maxW % 16 : maxW % 9))
		calHeight = calWidth * (1 / aspectRatio)
	} else if (aspectRatio <= maxW / maxH) {
		calHeight = Math.floor(maxH - (!isShorts ? maxH % 9 : maxH % 16))
		calWidth = calHeight * aspectRatio
	}
	return { width: calWidth, height: calHeight }
}

const CanvasComponent = React.memo(
	({
		bounds,
		dataConfig,
		viewConfig,
		isPreview,
		scale = 1,
		stage,
		canvasId,
	}: {
		bounds: RectReadOnly
		dataConfig: Block[]
		viewConfig: ViewConfig
		isPreview: boolean
		scale?: number
		stage?: React.RefObject<Konva.Stage>
		canvasId?: string
	}) => {
		const user = useUser()
		const state = useRecoilValue(studioStateAtom)
		const theme = useRecoilValue(themeAtom)
		const transition = useRecoilValue(transitionAtom)
		const { start } = useContext(StudioContext)

		const [mountStage, setMountStage] = useState(false)

		const stageRef1 = useRef<Konva.Stage>(null)
		// Doing this because if called from studio, we pass stageRef as it is used to get the thumbnail
		const stageRef = stage || stageRef1

		const layerRef = useRef<Konva.Layer>(null)
		const Bridge = useRecoilBridgeAcrossReactRoots_UNSTABLE()

		const shortsMode = useRecoilValue(fragmentTypeAtom) !== 'Landscape'

		// state which stores the type of layer children which have to be placed over the studio user
		const [topLayerChildren, setTopLayerChildren] = useState<{
			id: string
			state: TopLayerChildren
		}>({ id: '', state: '' })

		const { height: stageHeight, width: stageWidth } = getIntegerHW({
			maxH: bounds.height * scale,
			maxW: bounds.width * scale,
			aspectRatio: shortsMode ? 9 / 16 : 16 / 9,
			isShorts: shortsMode,
		})

		useEffect(() => {
			if (!stageWidth) return
			Konva.pixelRatio = (shortsMode ? 1080 : 1920) / stageWidth
			setMountStage(true)
		}, [stageWidth, shortsMode])

    useEffect(() => {
      if(!canvasId || !layerRef?.current) return
      // eslint-disable-next-line no-underscore-dangle
      const canvas = layerRef.current.getCanvas()._canvas
			canvas.id = canvasId
    },[canvasId, layerRef?.current])

		useEffect(() => {
			if (state === 'recording' && mountStage) start()
		}, [state, mountStage])

		const room = useRoom()

		return (
			<div>
				{mountStage && (
					<Stage
						ref={stageRef}
						className='mt-auto mb-auto ring-1 ring-gray-200'
						width={stageWidth || 1}
						height={stageHeight || 1}
						scale={{
							x:
								stageHeight /
								(shortsMode ? SHORTS_CONFIG.height : CONFIG.height),
							y: stageWidth / (shortsMode ? SHORTS_CONFIG.width : CONFIG.width),
						}}
					>
						<Bridge>
							<UserContext.Provider value={user}>
								<RoomContext.Provider value={room}>
									<Layer ref={layerRef}>
										{(() => (
											<Group>
												<UnifiedFragment
													stageRef={stageRef}
													setTopLayerChildren={setTopLayerChildren}
													config={dataConfig}
													layoutConfig={viewConfig}
													isPreview={isPreview}
												/>
												<GetTopLayerChildren
													key={topLayerChildren?.id}
													topLayerChildrenState={topLayerChildren?.state || ''}
													setTopLayerChildren={setTopLayerChildren}
													isShorts={shortsMode || false}
													theme={theme}
													speakersLength={viewConfig?.speakers?.length || 1}
													introBlockViewProps={
														(
															viewConfig?.blocks[
																(dataConfig?.[0] as IntroBlockProps).id
															]?.view as IntroBlockView
														)?.intro
													}
													transitionSettings={{
														blockTransition: transition?.blockTransition?.name,
														swapTransition: transition?.swapTransition?.name,
													}}
													// performFinishAction={() => {
													// 	stopCanvasRecording()
													// 	setState('preview')
													// }}
												/>
											</Group>
										))()}
									</Layer>
								</RoomContext.Provider>
							</UserContext.Provider>
						</Bridge>
					</Stage>
				)}
			</div>
		)
	}
)
export default CanvasComponent
