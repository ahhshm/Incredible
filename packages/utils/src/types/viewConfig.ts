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

import { LiveMap } from '@liveblocks/client'

export const allLayoutTypes = [
	'classic',
	'float-full-right',
	'float-full-left',
	'float-half-right',
	'padded-bottom-right-tile',
	'padded-bottom-right-circle',
	'bottom-right-tile',
	'bottom-right-circle',
	'padded-split',
	'split',
	'full-left',
	'full-right',
	'split-without-media',
	'outro',
] as const

export const shortsLayoutTypes = [
	'classic',
	'padded-bottom-right-circle',
	'padded-bottom-right-tile',
	'bottom-right-tile',
	'bottom-right-circle',
	'split',
	'full-left',
	'full-right',
] as const

export const outroLayoutTypes = [
	'classic',
	'float-full-right',
	// 'float-full-left',
	'split-without-media',
] as const

export const introLayoutTypes = [
	'bottom-right-tile',
	'float-full-right',
] as const

export const shortsOutroLayoutTypes = ['classic', 'split'] as const

export type IntroLayout = typeof introLayoutTypes[number]

export type OutroLayout = typeof outroLayoutTypes[number]

export type Layout = typeof allLayoutTypes[number]

export type TransitionDirection = 'left' | 'right' | 'moveIn' | 'moveAway'

export type TopLayerChildren =
	| `transition ${TransitionDirection}`
	| 'lowerThird'
	| ''

export type Gradient = {
	id: number
	angle: number
	values: (number | string)[]
	cssString: string
}

export type GradientConfig = {
	id: number
	cssString: string
	values: (string | number)[]
	startIndex: { x: number; y: number }
	endIndex: { x: number; y: number }
}

export type CodeBlockView = {
	type: 'codeBlock'
	code: CodeBlockViewProps
}

export type CodeBlockViewProps = {
	animation: CodeAnimation
	highlightSteps?: CodeHighlightConfig[]
	theme: CodeTheme
	fontSize?: number
	codeStyle?: CodeStyle
}

export enum CodeAnimation {
	TypeLines = 'Type lines',
	HighlightLines = 'Highlight lines',
	// InsertInBetween = 'Insert in between',
}

export const enum CodeTheme {
	Light = 'light_vs',
	LightPlus = 'light_plus',
	QuietLight = 'quietlight',
	SolarizedLight = 'solarized_light',
	Abyss = 'abyss',
	Dark = 'dark_vs',
	DarkPlus = 'dark_plus',
	KimbieDark = 'kimbie_dark',
	Monokai = 'monokai',
	MonokaiDimmed = 'monokai_dimmed',
	Red = 'red',
	SolarizedDark = 'solarized_dark',
	TomorrowNightBlue = 'tomorrow_night_blue',
	HighContrast = 'hc_black',
}

export type CodeHighlightConfig = {
	step?: string
	from?: number
	to?: number
	valid?: boolean
	fileIndex?: number
	lineNumbers?: number[]
}

export enum CodeStyle {
	Editor = 'editor',
	Terminal = 'terminal',
}

export type ImageBlockView = {
	type: 'imageBlock'
	image: ImageBlockViewProps
}

export type ImageBlockViewProps = {
	captionTitleView?: CaptionTitleView
}

export type CaptionTitleView =
	| 'titleOnly'
	| 'captionOnly'
	| 'none'
	| 'titleAndCaption'

export type VideoBlockView = {
	type: 'videoBlock'
	video: VideoBlockViewProps
}

export type VideoBlockViewProps = {
	captionTitleView?: CaptionTitleView
}
export type ListBlockView = {
	type: 'listBlock'
	list: ListBlockViewProps
}

export type ListBlockViewProps = {
	viewStyle?: ListViewStyle
	appearance?: ListAppearance
	orientation?: ListOrientation
	displayTitle?: boolean
}

export type ListAppearance = 'stack' | 'replace' | 'allAtOnce'
export type ListViewStyle = 'none' | 'bullet' | 'number'
export type ListOrientation = 'horizontal' | 'vertical'

export type HeadingBlockView = {
	type: 'headingBlock'
}

export type HandleDetails = {
	enabled: boolean
	handle: string
}

export type OutroState = 'outroVideo' | 'titleSplash'
export type OutroBlockViewProps = {
	title?: string
	twitter?: HandleDetails
	discord?: HandleDetails
	youtube?: HandleDetails
	website?: HandleDetails
	linkedin?: HandleDetails
	noOfSocialHandles?: number
	order?: { enabled: boolean; state: OutroState }[]
}

export type OutroBlockView = {
	type: 'outroBlock'
	outro: OutroBlockViewProps
}

export type IntroState = 'userMedia' | 'titleSplash' | 'introVideo'
export type IntroBlockViewProps = {
	heading?: string
	name?: string
	designation?: string
	organization?: string
	displayPicture?: string
	order?: { enabled: boolean; state: IntroState }[]
}
export type IntroBlockView = {
	type: 'introBlock'
	intro: IntroBlockViewProps
}

export type BlockView =
	| CodeBlockView
	| ImageBlockView
	| VideoBlockView
	| ListBlockView
	| HeadingBlockView
	| OutroBlockView
	| IntroBlockView

export type BlockProperties = {
	gradient?: GradientConfig
	layout?: Layout
	bgColor?: string
	bgOpacity?: number
	view?: BlockView
}

export type ViewConfig = {
	mode: 'Portrait' | 'Landscape'
	speakers: any // FlickParticipantsFragment[] ... inferQueryOutput<'story.byId'>['Participants']
	blocks: {
		[key: string]: BlockProperties
	}
	selectedBlocks: { blockId: string; pos: number }[] // used to store blockids of selected blocks from timeline
	continuousRecording: boolean
}

export type LiveViewConfig = {
	mode: 'Portrait' | 'Landscape'
	speakers: any // FlickParticipantsFragment[] ... inferQueryOutput<'story.byId'>['Participants']
	blocks: LiveMap<string, BlockProperties>
	selectedBlocks: { blockId: string; pos: number }[] // used to store blockids of selected blocks from timeline
	continuousRecording: boolean
}

export enum ConfigType {
	CODEJAM = 'codejam',
	VIDEOJAM = 'videojam',
	TRIVIA = 'trivia',
	POINTS = 'points',
}
