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

import { FiEdit, FiRepeat, FiTrash } from 'react-icons/fi'

const VideoTooltip = ({
	editVideo,
	retakeVideo,
	deleteVideo,
	node,
	updateAttributes,
}: {
	deleteVideo: () => void
	editVideo: (val: boolean) => void
	retakeVideo: (val: boolean) => void
	node: any
	updateAttributes: any
}) => (
	<div className='hidden group-hover:flex items-center gap-x-1 pl-2 text-gray-300 bg-gray-800 rounded-sm m-2 absolute z-50 shadow-md cursor-default font-body'>
		<FiEdit
			size={16}
			className='mx-1 cursor-pointer hover:text-gray-50'
			onClick={() => editVideo(true)}
		/>
		<FiRepeat
			size={16}
			className='mx-1 cursor-pointer hover:text-gray-50'
			onClick={() => retakeVideo(true)}
		/>
		<FiTrash
			size={16}
			className='mx-1 cursor-pointer hover:text-gray-50'
			onClick={deleteVideo}
		/>
		<button
			className='hidden group-hover:block hover:bg-gray-700 text-white px-2  border-gray-300 pl-2 rounded-r-sm py-1'
			type='button'
			onClick={() => {
				if (node.attrs.caption === null)
					updateAttributes({
						caption: '',
					})
				else
					updateAttributes({
						caption: null,
					})
			}}
		>
			{node.attrs.caption === null ? 'Add caption' : 'Remove Caption'}
		</button>
	</div>
)

export default VideoTooltip
