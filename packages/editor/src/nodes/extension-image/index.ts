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

import { Node, nodeInputRule } from '@tiptap/core'
import { mergeAttributes, ReactNodeViewRenderer } from '@tiptap/react'
import { uploadImagePlugin } from './upload-image-plugin'
import { Image } from './Image'

interface ImageOptions {
	inline: boolean
	HTMLAttributes: Record<string, any>
}

declare module '@tiptap/core' {
	interface Commands<ReturnType> {
		image: {
			/**
			 * Add an image
			 */
			setImage: (options: {
				src: string
				alt?: string
				title?: string
			}) => ReturnType
		}
	}
}

const IMAGE_INPUT_REGEX = /!\[(.+|:?)\]\((\S+)(?:(?:\s+)["'](\S+)["'])?\)/

export default Node.create<ImageOptions>({
	name: 'image',

	isolating: true,

	addOptions() {
		return {
			...this.parent?.(),
			inline: false,
			HTMLAttributes: {},
		}
	},

	inline() {
		return this.options.inline
	},

	group() {
		return this.options.inline ? 'inline' : 'block'
	},

	addAttributes() {
		return {
			src: {
				default: null,
			},
			alt: {
				default: null,
			},
			title: {
				default: null,
			},
			caption: {
				default: null,
			},
		}
	},
	parseHTML: () => [
		{
			tag: 'img[src]',
			getAttrs: dom => {
				if (typeof dom === 'string') return {}
				const element = dom as HTMLImageElement

				const obj = {
					src: element.getAttribute('src'),
					title: element.getAttribute('title'),
					alt: element.getAttribute('alt'),
				}
				return obj
			},
		},
	],
	renderHTML: ({ HTMLAttributes }) => ['img', mergeAttributes(HTMLAttributes)],

	addNodeView() {
		return ReactNodeViewRenderer(Image)
	},

	addCommands() {
		return {
			setImage:
				attrs =>
				({ state, dispatch }) => {
					const { selection } = state
					const position = selection.$head
						? selection.$head.pos
						: selection.$to.pos

					const node = this.type.create(attrs)
					const transaction = state.tr.insert(position - 1, node)
					return dispatch?.(transaction)
				},
		}
	},
	addInputRules() {
		return [
			nodeInputRule({
				find: IMAGE_INPUT_REGEX,
				type: this.type,
				getAttributes: match => {
					const [, alt, src, title] = match
					return {
						src,
						alt,
						title,
					}
				},
			}),
		]
	},
	addProseMirrorPlugins() {
		return [uploadImagePlugin()]
	},
})
