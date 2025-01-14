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

/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable @next/next/no-img-element */

import { css, cx } from '@emotion/css'
import { Popover, Transition } from '@headlessui/react'
import { Fragment, HTMLAttributes, useEffect, useState } from 'react'
import {
	IoAlbumsOutline,
	IoCheckmark,
	IoChevronForwardOutline,
} from 'react-icons/io5'
import { useRecoilState, useRecoilValue } from 'recoil'
import { flickAtom } from 'src/stores/flick.store'
import { themeAtom } from 'src/stores/studio.store'
import {
	RoomEventTypes,
	useBroadcastEvent,
	useEventListener,
} from 'src/utils/liveblocks.config'
import { Button, emitToast } from 'ui/src'
import { useEnv } from 'utils/src'
import trpc, { inferQueryOutput } from '../../../server/trpc'

const horizontalCustomScrollBar = css`
	::-webkit-scrollbar {
		height: 0.45rem;
		padding: 0.5rem 0;
	}
	::-webkit-scrollbar-thumb {
		height: 0.45rem;
		background-color: #4d4d4d;
		border-radius: 1rem;
	}
	/* hover */
	::-webkit-scrollbar-thumb:hover {
		background-color: #9ca3af;
	}
`

const HorizontalContainer = ({
	className,
	...rest
}: HTMLAttributes<HTMLDivElement>) => (
	<div
		className={cx(
			'flex items-center overflow-x-scroll overflow-y-hidden w-full',
			horizontalCustomScrollBar,
			className
		)}
		{...rest}
	/>
)

const Theme = () => {
	const { data } = trpc.useQuery(['util.themes'])
	const [activeTheme, setActiveTheme] = useRecoilState(themeAtom)

	const flickId = useRecoilValue(flickAtom)?.id

	const broadcast = useBroadcastEvent()

	const {
		storage: { cdn: baseUrl },
	} = useEnv()
	const [activeScreen, setActiveScreen] = useState<'theme' | 'themes'>('themes')
	const [tempActiveTheme, setTempActiveTheme] =
		useState<inferQueryOutput<'util.themes'>[number]>()

	useEffect(() => {
		setTempActiveTheme(activeTheme)
	}, [activeTheme])

	const { mutateAsync: updateTheme, isLoading: loading } = trpc.useMutation([
		'story.updateTheme',
	])

	useEffect(() => {
		if (tempActiveTheme) {
			setActiveScreen('theme')
		} else {
			setActiveScreen('themes')
		}
	}, [tempActiveTheme])

	const updateFlickTheme = async (close: () => void) => {
		if (!tempActiveTheme) return
		if (!flickId) {
			console.error('flickId is null.Cant update theme')
			return
		}

		const updateData = await updateTheme({
			id: flickId,
			themeName: tempActiveTheme.name,
		})

		if (updateData.success) {
			setActiveTheme(tempActiveTheme)
			emitToast(`Theme Updated to ${tempActiveTheme.name} successfully`, {
				type: 'success',
			})
			broadcast({
				type: RoomEventTypes.ThemeChanged,
				payload: tempActiveTheme,
			})
			close()
		} else {
			emitToast('Error saving theme', {
				type: 'error',
			})
		}
	}

	useEventListener(({ event }) => {
		if (event.type === RoomEventTypes.ThemeChanged) {
			setActiveTheme(event.payload)
		}
	})

	return (
		<Popover>
			{({ open, close }) => (
				<>
					<Popover.Button
						className={cx(
							'text-gray-100 flex items-center gap-x-2 text-size-xs hover:bg-white/10 px-2 py-2 rounded-sm transform active:scale-95 transition-all font-main font-semibold',
							{
								'bg-white/10': open,
							}
						)}
					>
						<IoAlbumsOutline className='h-4 w-4' />
						Theme
					</Popover.Button>
					<Transition
						as={Fragment}
						enter='transition ease-out duration-200'
						enterFrom='opacity-0 -translate-y-10'
						enterTo='opacity-100 translate-y-1'
						leave='transition ease-in duration-150'
						leaveFrom='opacity-100 translate-y-0'
						leaveTo='opacity-0 -translate-y-10'
					>
						<Popover.Panel className='absolute z-10 right-0 mt-1.5' as='div'>
							<div
								className={cx(
									'text-white rounded-md p-4 mx-4 max-h-screen',
									css`
										width: 70vw;
										background-color: #27272a;
									`
								)}
							>
								<div className='flex items-center justify-between'>
									<h4 className='flex items-center h-8'>
										<button
											type='button'
											className={cx('text-white cursor-pointer text-size-sm', {
												'opacity-70 hover:opacity-100':
													activeScreen !== 'themes',
												'opacity-100': activeScreen === 'themes',
											})}
											onClick={() => {
												setActiveScreen('themes')
												setTempActiveTheme(undefined)
											}}
										>
											Themes
										</button>
										{tempActiveTheme && (
											<>
												<IoChevronForwardOutline size={14} className='mx-px' />
												<span className='text-white cursor-pointer text-size-sm'>
													{tempActiveTheme.name}
												</span>
											</>
										)}
									</h4>
									{activeScreen === 'theme' && (
										<Button
											colorScheme='dark'
											loading={loading}
											onClick={() => updateFlickTheme(close)}
										>
											Use Theme
										</Button>
									)}
								</div>
								{activeScreen === 'theme' ? (
									<HorizontalContainer>
										{JSON.parse(
											JSON.stringify(tempActiveTheme?.config)
										)?.previewImages?.map((image: string) => (
											<button
												type='button'
												className='flex items-center justify-center mr-4 flex-shrink-0 py-4'
												key={image}
												onClick={() => updateFlickTheme(close)}
											>
												<img
													className='object-cover w-64 border-2 border-gray-600 rounded-md shadow-md hover:border-brand h-36'
													src={image ? baseUrl + image : ''}
													alt='incredible'
												/>
											</button>
										))}
									</HorizontalContainer>
								) : (
									<div
										className={cx(
											'flex gap-x-4 z-50 overflow-x-scroll',
											horizontalCustomScrollBar
										)}
									>
										{data?.map(theme => (
											<button
												type='button'
												key={theme.name}
												className='relative flex items-center justify-center py-4'
												onClick={() => setTempActiveTheme(theme)}
											>
												<div
													className='object-cover w-64 border-2 border-gray-600 rounded-md shadow-md hover:border-brand h-36 relative'
													style={{
														background: `url(${
															JSON.parse(JSON.stringify(theme.config)).thumbnail
																? baseUrl +
																  JSON.parse(JSON.stringify(theme.config))
																		.thumbnail
																: ''
														})`,
														backgroundSize: '256px 144px',
													}}
												>
													{activeTheme?.name === theme.name && (
														<IoCheckmark
															size={24}
															className='absolute p-1 font-bold rounded-md top-2 right-2 text-brand bg-green-600'
														/>
													)}
												</div>
											</button>
										))}
									</div>
								)}
							</div>
						</Popover.Panel>
					</Transition>
				</>
			)}
		</Popover>
	)
}

export default Theme
