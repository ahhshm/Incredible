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

import Konva from 'konva'
import React, { useEffect, useState } from 'react'
import { Group, Image } from 'react-konva'
import { ClipConfig, useEdit } from './hooks/useEdit'

export interface VideoConfig {
	x?: number
	y?: number
	width: number
	height: number
	borderColor?: string
	borderWidth?: number
	cornerRadius?: number
	performClip: boolean
	videoFill?: string
	backgroundRectX?: number
	backgroundRectY?: number
	backgroundRectColor?: string
	backgroundRectBorderColor?: string
	backgroundRectBorderWidth?: number
	clipVideoConfig: ClipConfig
}

export const Video = ({
	videoElement,
	videoConfig,
}: {
	videoElement: HTMLVideoElement
	videoConfig: VideoConfig
}) => {
	const imageRef = React.useRef<Konva.Image>(null)
	const { getImageDimensions } = useEdit()
	// stores the calculated dimensions for the cropped video which will be used to in the clip function
	const [videoDimensions, setVideoDimensions] = useState<{
		width: number
		height: number
		x: number
		y: number
	}>({ width: 0, height: 0, x: 0, y: 0 })

	// stores the scaled dimensions of the original video, such that the cropped video's width and height has to match the videoDimensions above
	const [scaledOriginalVideoDim, setScaledOriginalVideoDim] = useState<{
		width: number
		height: number
		x: number
		y: number
	}>({ width: 0, height: 0, x: 0, y: 0 })

	const { clipRect } = useEdit()

	// when video is loaded, we should read it size
	React.useEffect(() => {
		const onload = () => {
			setVideoDimensions(
				getImageDimensions(
					{
						w:
							(videoElement &&
								videoElement.videoWidth * videoConfig.clipVideoConfig.width) ||
							0,
						h:
							(videoElement &&
								videoElement.videoHeight *
									videoConfig.clipVideoConfig.height) ||
							0,
					},
					videoConfig.width,
					videoConfig.height,
					videoConfig.width,
					videoConfig.height,
					videoConfig.x ? videoConfig.x : 0,
					videoConfig.y ? videoConfig.y : 0
				)
			)
		}
		videoElement.addEventListener('loadedmetadata', onload)
		return () => {
			videoElement.removeEventListener('loadedmetadata', onload)
		}
	}, [videoElement, videoConfig])

	useEffect(() => {
		setVideoDimensions(
			// getting the appropriate dimensions for the cropped video to be placed correctly on the canvas
			getImageDimensions(
				{
					w:
						(videoElement &&
							videoElement.videoWidth * videoConfig.clipVideoConfig.width) ||
						0,
					h:
						(videoElement &&
							videoElement.videoHeight * videoConfig.clipVideoConfig.height) ||
						0,
				},
				videoConfig.width,
				videoConfig.height,
				videoConfig.width,
				videoConfig.height,
				videoConfig.x ? videoConfig.x : 0,
				videoConfig.y ? videoConfig.y : 0
			)
		)
	}, [videoConfig])

	useEffect(() => {
		setScaledOriginalVideoDim({
			width: videoDimensions.width / videoConfig.clipVideoConfig.width,
			height: videoDimensions.height / videoConfig.clipVideoConfig.height,
			x:
				videoDimensions.x -
				(videoConfig.clipVideoConfig.x * videoDimensions.width) /
					videoConfig.clipVideoConfig.width,
			y:
				videoDimensions.y -
				(videoConfig.clipVideoConfig.y * videoDimensions.height) /
					videoConfig.clipVideoConfig.height,
		})
	}, [videoDimensions])

	useEffect(() => {
		const layer = imageRef.current?.getLayer()

		const anim = new Konva.Animation(() => {}, layer)
		anim.start()

		return () => {
			anim.stop()
		}
	}, [videoElement])

	return (
		<>
			{/* <Rect
        x={
          imgDim.x -
          ((videoConfig.x ? videoConfig.x : 0) -
            (videoConfig?.backgroundRectX ? videoConfig?.backgroundRectX : 0))
        }
        y={
          imgDim.y -
          ((videoConfig.y ? videoConfig.y : 0) -
            (videoConfig.backgroundRectY ? videoConfig?.backgroundRectY : 0))
        }
        //  videoConfig.backgroundRectY || imgDim.y || 0}
        width={imgDim.width}
        fill={videoConfig.backgroundRectColor}
        height={imgDim.height}
        stroke={videoConfig.backgroundRectBorderColor}
        strokeWidth={videoConfig?.backgroundRectBorderWidth || 0}
        cornerRadius={videoConfig?.cornerRadius || 0}
      />
      <Rect
        x={
          imgDim.x ||
          (imgDim.width -
            (imgDim.height * videoElement.videoWidth) /
              videoElement.videoHeight) /
            2
        }
        y={imgDim.y || 0}
        width={imgDim.width}
        height={imgDim.height}
        stroke={videoConfig.borderColor}
        strokeWidth={videoConfig?.borderWidth || 0}
        cornerRadius={videoConfig?.cornerRadius || 0}
      /> */}
			<Group
				x={scaledOriginalVideoDim.x}
				y={scaledOriginalVideoDim.y}
				width={scaledOriginalVideoDim.width}
				height={scaledOriginalVideoDim.height}
				clipFunc={
					videoConfig.performClip
						? (ctx: any) => {
								clipRect(ctx, {
									x:
										videoConfig.clipVideoConfig.x *
										scaledOriginalVideoDim.width,
									y:
										videoConfig.clipVideoConfig.y *
										scaledOriginalVideoDim.height,
									width: videoDimensions.width,
									height: videoDimensions.height,
									borderRadius: videoConfig?.cornerRadius || 0,
								})
						  }
						: undefined
				}
			>
				<Image
					ref={imageRef}
					image={videoElement}
					width={scaledOriginalVideoDim.width}
					height={scaledOriginalVideoDim.height}
				/>
			</Group>
		</>
	)
}
