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

import debounce from 'lodash/debounce'
import Link from 'next/link'
import ReactTooltip from 'react-tooltip'
import { cx } from '@emotion/css'
import { useUser } from 'src/utils/providers/auth'
import { Avatar, Button, emitToast } from 'ui/src'
import trpc, { inferMutationInput, inferQueryOutput } from '../../server/trpc'

type SeriesParticipantFragment =
	inferQueryOutput<'series.get'>['Flick_Series'][number]['Flick']['Participants'][number]

const Collaborators = ({
	seriesTags,
	seriesParticipants,
	setSeriesParticipants,
}: {
	seriesParticipants: (SeriesParticipantFragment & { following?: boolean })[]
	setSeriesParticipants: (
		participants: (SeriesParticipantFragment & { following?: boolean })[]
	) => void
	seriesTags: string[]
}) => {
	const { uid: sub } = useUser().user ?? {}

	const { mutateAsync: follow } = trpc.useMutation(['user.follow'])
	const { mutateAsync: unfollow } = trpc.useMutation(['user.unfollow'])

	const handleUserFollow = async ({
		targetId,
		followerId,
		isFollowing,
		participantId,
	}: inferMutationInput<'user.follow'> & {
		isFollowing: boolean
		participantId: string
	}) => {
		const participants = [...seriesParticipants]
		const participantIndex = participants.findIndex(p => p.id === participantId)
		if (participantIndex === -1) return

		if (isFollowing) {
			const { success } = await unfollow({
				followerId,
				targetId,
			})
			if (success) {
				participants.splice(participantIndex, 1, {
					...participants[participantIndex],
					following: false,
				})
			}
			if (!success)
				emitToast('Something went wrong', {
					type: 'error',
				})
		} else {
			const { success } = await follow({
				targetId,
				followerId,
			})
			if (success) {
				emitToast(
					`Now following ${participants[participantIndex].User.displayName}`,
					{
						type: 'success',
					}
				)
				participants.splice(participantIndex, 1, {
					...participants[participantIndex],
					following: true,
				})
			}
			if (!success)
				emitToast('Something went wrong', {
					type: 'error',
				})
		}
		setSeriesParticipants(participants)
	}

	const handleUserFollowDebounced = debounce(handleUserFollow, 500)

	return (
		<div className='flex flex-col items-start justify-start w-full mb-6 pb-4 md:pt-0 md:mt-0 px-1 md:px-0 border-b border-dark-100 md:border-transparent'>
			<h2 className='flex items-center mb-4 font-semibold text-dark-title font-main'>
				Collaborators{' '}
				<span className='ml-2 bg-dark-400 text-size-sm px-2 py-1.5 rounded-sm'>
					{seriesParticipants.length}
				</span>
			</h2>

			<div className='flex -space-x-1 md:hidden'>
				{seriesParticipants?.map((participant, index) => {
					const getRing = (i: number) => {
						if (i === 0) return 'border-green-500'
						if (i === 1) return 'border-purple-400'
						if (i === 2) return 'border-blue-400'
						if (i === 3) return 'border-indigo-500'
						return 'border-yellow-400'
					}

					return (
						<Link href={`/${participant.User.username}`} passHref>
							<a href={`/${participant.User.username}`}>
								<Avatar
									src={participant.User.picture ?? ''}
									alt={participant.User.displayName ?? ''}
									className={cx(
										'h-8 w-8 rounded-full border-2 cursor-pointer',
										getRing(index)
									)}
									name={participant.User.displayName ?? ''}
								/>
							</a>
						</Link>
					)
				})}
			</div>
			<div className='hidden md:flex flex-col gap-y-2.5'>
				{seriesParticipants?.map((participant, index) => {
					const getRing = (i: number) => {
						if (i === 0) return 'border-green-500'
						if (i === 1) return 'border-purple-400'
						if (i === 2) return 'border-blue-400'
						if (i === 3) return 'border-indigo-500'
						return 'border-yellow-400'
					}

					return (
						<div className='flex items-center w-full'>
							<div
								className={cx(
									'mr-2 overflow-hidden border-2 flex-shrink-0 w-8 h-8 rounded-full',
									getRing(index)
								)}
								data-tip
								data-place='left'
								data-effect='solid'
								data-for={participant.id}
								data-event='click mouseenter focus'
								data-event-off='blur mouseleave'
							>
								<Avatar
									src={participant.User.picture ?? ''}
									alt={participant.User.displayName ?? ''}
									className='cursor-pointer'
									name={participant.User.displayName ?? ''}
								/>
							</div>
							<Link href={`/${participant.User.username}`} passHref>
								<h6 className='text-size-sm cursor-pointer w-full'>
									{participant.User.displayName}
								</h6>
							</Link>
							<ReactTooltip
								id={participant.id}
								type='dark'
								globalEventOff='click'
								delayShow={500}
								delayHide={500}
								clickable
							>
								<div className='flex flex-col items-start rounded-md'>
									<Link href={`/${participant.User.username}`} passHref>
										<div className='flex items-center justify-between cursor-pointer'>
											<div
												className={cx(
													'mr-2 overflow-hidden border-2 flex-shrink-0 w-8 h-8 rounded-full',
													getRing(index)
												)}
											>
												<Avatar
													src={participant.User.picture ?? ''}
													alt={participant.User.displayName ?? ''}
													className='cursor-pointer'
													name={participant.User.displayName ?? ''}
												/>
											</div>
											<div>
												<p className='text-size-xs'>
													{participant.User.displayName}
												</p>
												<p className='text-size-xxs text-dark-title-200'>
													{`@${participant.User.username}`}
												</p>
											</div>
										</div>
									</Link>

									<Button
										className={cx('mt-3 max-w-none w-full', {
											'border border-dark-100 hover:bg-dark-100/30 active:scale-95':
												participant.following,
										})}
										appearance={participant.following ? 'none' : 'solid'}
										onClick={() =>
											handleUserFollowDebounced({
												followerId: sub as string,
												targetId: participant.User.sub,
												isFollowing: participant.following ?? false,
												participantId: participant.id,
											})
										}
									>
										{participant.following ? 'Following' : 'Follow'}
									</Button>
								</div>
							</ReactTooltip>
						</div>
					)
				})}
			</div>
			{seriesTags.length > 0 && (
				<>
					<hr className='w-full my-4 border-dark-200' />
					<h2 className='mb-4 text-lg font-semibold text-dark-title font-main'>
						Tags{' '}
						<span className='ml-2 bg-dark-400 text-xs px-2 py-[2px] rounded-sm'>
							{seriesTags.length}
						</span>
					</h2>
					<div className='flex flex-wrap items-center justify-start'>
						{seriesTags.map(tag => (
							<span
								key={tag}
								className='px-2 py-1 mr-2 text-xs rounded-sm bg-dark-100 font-main'
							>
								{tag}
							</span>
						))}
					</div>
				</>
			)}
		</div>
	)
}

export default Collaborators
