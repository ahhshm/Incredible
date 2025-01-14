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

import React from 'react'
import { Arc, Circle, Group, Image, Rect, Ring } from 'react-konva'
import { CONFIG } from 'src/utils/configs'
import useImage from 'use-image'
import { Layout, useEnv } from 'utils/src'

// This components returns the additional elements for the thumbnail based on theme
const ThumbnailElements = ({
	theme,
	layout,
	isShorts,
	stageConfig,
	titleConfig,
}: {
	theme: string
	layout: Layout | undefined
	isShorts: boolean
	stageConfig: {
		width: number
		height: number
	}
	titleConfig:
		| {
				y: number
				height: number
		  }
		| undefined
}) => {
	const { storage } = useEnv()
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
	switch (theme) {
		case 'DevsForUkraine': {
			if (layout === 'classic' && !isShorts)
				return (
					<>
						<Rect
							x={0}
							y={0}
							width={stageConfig.width}
							height={stageConfig.height}
							fill='#1C1C1C'
						/>
						<Group x={85} y={(titleConfig?.y || 0) + 22 || 202}>
							<Ring innerRadius={22} outerRadius={30} fill='#fafafa' />
							<Circle x={123} radius={34} fill='#2696FA' />
							<Rect x={25} y={-4} width={98} height={8} fill='#fafafa' />
						</Group>
						<Group x={772} y={(titleConfig?.y || 0) + 22 || 202}>
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
						<Group
							x={772}
							y={
								(titleConfig?.y || 0) + (titleConfig?.height || 0) - 56 >
								(titleConfig?.y || 0) + 22 + 80
									? (titleConfig?.y || 0) + (titleConfig?.height || 0) - 56
									: (titleConfig?.y || 0) + 22 + 80
							}
						>
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
						<Image
							x={196}
							y={
								(titleConfig?.y || 0) + (titleConfig?.height || 0) - 56 >
								(titleConfig?.y || 0) + 30 + 80
									? (titleConfig?.y || 0) + (titleConfig?.height || 0) - 56
									: (titleConfig?.y || 0) + 30 + 80
							}
							image={star}
							width={40}
							height={42}
						/>
						<Image x={40} y={40} image={heart} width={56} height={56} />
					</>
				)
			if (layout === 'bottom-right-tile' && !isShorts)
				return (
					<>
						<Rect
							x={0}
							y={0}
							width={stageConfig.width}
							height={stageConfig.height}
							fill='#1C1C1C'
						/>
						<Group x={83} y={120}>
							<Ring innerRadius={22} outerRadius={30} fill='#fafafa' />
							<Circle x={123} radius={34} fill='#2696FA' />
							<Rect x={25} y={-4} width={98} height={8} fill='#fafafa' />
						</Group>
						<Group x={780} y={114}>
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
						<Group x={776} y={216}>
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
						<Image x={196} y={275} image={star} width={40} height={42} />
						<Image x={536} y={315} image={heart} width={40} height={40} />
					</>
				)
			if (isShorts)
				return (
					<>
						<Rect
							x={0}
							y={0}
							width={stageConfig.width}
							height={stageConfig.height}
							fill='#1C1C1C'
						/>
						<Group x={18} y={40}>
							<Ring innerRadius={12} outerRadius={18} fill='#fafafa' />
							<Circle x={72} radius={20} fill='#2696FA' />
							<Rect x={18} y={-4} width={57} height={4} fill='#fafafa' />
						</Group>
						<Group
							x={335}
							y={(titleConfig?.y || 0) + (titleConfig?.height || 0) - 15 || 180}
						>
							<Arc
								innerRadius={15}
								outerRadius={20}
								angle={180}
								fill='#ffe87b'
								rotation={90}
							/>
							<Rect x={-4} y={-20} width={5} height={40} fill='#ffe87b' />
							<Rect x={12} y={8} width={40} height={5} fill='#fafafa' />
						</Group>
						<Group
							x={335}
							y={(titleConfig?.y || 0) + (titleConfig?.height || 0) - 15 + 56}
						>
							<Circle radius={20} fill='#e2ce68' />
							<Arc
								x={40}
								innerRadius={0}
								outerRadius={20}
								angle={180}
								fill='#2696FA'
								rotation={90}
							/>
						</Group>
						<Image x={12} y={266} image={star} width={24} height={25} />
						<Image x={182} y={645} image={heart} width={32} height={32} />
					</>
				)
			return null
		}
		case 'Obsidian': {
			if (layout === 'classic' && !isShorts)
				return (
					<Group>
						<Image
							x={0}
							y={0}
							image={pantherBg}
							width={CONFIG.width}
							height={CONFIG.height}
						/>
						<Rect
							x={216}
							y={464}
							width={680}
							height={5}
							fillLinearGradientColorStops={[0, '#F11012', 1, '#FFB626']}
							fillLinearGradientStartPoint={{ x: 0, y: 0 }}
							fillLinearGradientEndPoint={{
								x: 680,
								y: 0,
							}}
						/>
					</Group>
				)
			if (layout === 'bottom-right-tile' && !isShorts)
				return (
					<Group>
						<Image
							x={0}
							y={0}
							image={pantherBg}
							width={CONFIG.width}
							height={CONFIG.height}
						/>
						<Rect
							x={216}
							y={245}
							width={680}
							height={5}
							fillLinearGradientColorStops={[0, '#F11012', 1, '#FFB626']}
							fillLinearGradientStartPoint={{ x: 0, y: 0 }}
							fillLinearGradientEndPoint={{
								x: 680,
								y: 0,
							}}
						/>
					</Group>
				)
			return null
		}
		case 'Cardinal': {
			if (layout === 'classic' && !isShorts)
				return (
					<Rect
						x={456}
						y={153}
						width={280}
						height={280}
						cornerRadius={140}
						fill='#C5203E'
					/>
				)
			if (layout === 'bottom-right-circle' && !isShorts)
				return (
					<Rect
						x={634}
						y={169}
						width={240}
						height={240}
						cornerRadius={120}
						fill='#C5203E'
					/>
				)
			if (layout === 'float-full-right' && !isShorts)
				return (
					<Group>
						<Rect x={0} y={0} width={632} height={540} fill='#091F40' />
						<Rect
							x={470}
							y={-56}
							width={240}
							height={240}
							cornerRadius={120}
							fill='#C5203E'
						/>
						<Rect
							x={44}
							y={44}
							width={547}
							height={452}
							stroke='#ffffff'
							strokeWidth={1}
							dash={[10, 5.5]}
						/>
						<Rect x={64} y={64} width={507} height={412} fill='#ffffff' />
					</Group>
				)
			return null
		}
		default:
			return null
	}
}

export default ThumbnailElements
