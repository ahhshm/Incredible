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
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { css, cx } from '@emotion/css'
import { Dialog } from '@headlessui/react'
import { Block } from 'editor/src/utils/types'
import getBlobDuration from 'get-blob-duration'
import Konva from 'konva'
import { nanoid } from 'nanoid'
import { useEffect, useMemo, useRef, useState } from 'react'
import { FiRotateCcw, FiUpload } from 'react-icons/fi'
import { IoArrowBackOutline } from 'react-icons/io5'
import useMeasure from 'react-use-measure'
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil'
import {
	flickAtom,
	flickNameAtom,
	openStudioAtom,
} from 'src/stores/flick.store'
import {
	activeObjectIndexAtom,
	agoraActionsAtom,
	isStudioControllerAtom,
	recordedBlocksAtom,
	streamAtom,
	studioStateAtom,
} from 'src/stores/studio.store'
import { UploadType } from 'utils/src/enums'
import useCanvasRecorder from 'src/utils/hooks/useCanvasRecorder'
import useUpdateActiveObjectIndex from 'src/utils/hooks/useUpdateActiveObjectIndex'
import useUpdateState from 'src/utils/hooks/useUpdateState'
import {
	RoomEventTypes,
	useBroadcastEvent,
	useEventListener,
} from 'src/utils/liveblocks.config'
import { useUser } from 'src/utils/providers/auth'
import {
	Button,
	dismissToast,
	emitToast,
	Heading,
	Text,
	updateToast,
} from 'ui/src'
import { useEnv, useUploadFile, ViewConfig } from 'utils/src'
import trpc from '../../../server/trpc'
import CanvasComponent, { StudioContext } from '../canvas/CanvasComponent'
import RecordingControls from '../RecordingControls'
import Countdown from './Countdown'
import MediaControls from './MediaControls'
import MiniTimeline from './MiniTimeline'
import Notes from './Notes'
import PresenceAvatars from './PresenceAvatars'

const Studio = ({
	fragmentId,
	flickId,
	dataConfig,
	viewConfig,
	recordingId,
}: {
	fragmentId: string
	flickId: string
	dataConfig: Block[]
	viewConfig: ViewConfig
	recordingId: string
}) => {
	const { user } = useUser()
	const { storage } = useEnv()

	const state = useRecoilValue(studioStateAtom)
	const { updateState, reset: resetState } = useUpdateState(true)
	const activeObjectIndex = useRecoilValue(activeObjectIndexAtom)
	const { reset: resetActiveObjectIndex } = useUpdateActiveObjectIndex(true)
	const flick = useRecoilValue(flickAtom)
	const flickName = useRecoilValue(flickNameAtom)
	const setOpenStudio = useSetRecoilState(openStudioAtom)
	const agoraStreamData = useRecoilValue(streamAtom)
	const agoraActions = useRecoilValue(agoraActionsAtom)
	const [isStudioController, setIsStudioController] = useRecoilState(
		isStudioControllerAtom
	)
	const [recordedBlocks, setRecordedBlocks] = useRecoilState(recordedBlocksAtom)

	const [isHost, setIsHost] = useState(false)
	const [continuousRecordedBlockIds, setContinuousRecordedBlockIds] = useState<
		{ blockId: string; duration: number }[]
	>([])
	const [controlsRequestorSub, setControlsRequestorSub] = useState('')
	// bool used to open the modal which asks the host to accept or reject the request from the collaborator to get controls
	const [openControlsApprovalModal, setOpenControlsApprovalModal] =
		useState(false)

	const broadcast = useBroadcastEvent()

	const blockThumbnails = useRef<{ [key: string]: string }>({})
	const stageRef = useRef<Konva.Stage>(null)
	// bool to warn and ask the users to retake the multi block recording
	const confirmMultiBlockRetake = useRef<boolean>(false)

	const [uploadFile] = useUploadFile()
	const { mutateAsync: saveBlock } = trpc.useMutation(['block.save'])
	const { mutateAsync: saveMultiBlocks } = trpc.useMutation(['block.saveMany'])
	const deleteBlockGroupMutation = trpc.useMutation('block.delete')

	// used to measure the div
	const [ref, bounds] = useMeasure()

	const {
		startRecording: startCanvasRecording,
		stopRecording: stopCanvasRecording,
		reset: resetCanvas,
		getBlobs,
	} = useCanvasRecorder({})

	const start = () => {
		try {
			const canvas = document.getElementById('incredibleCanvas')
			// if (
			// 	dataConfig &&
			// 	dataConfig[activeObjectIndex]?.type !== 'introBlock'
			// )
			// setTopLayerChildren({ id: nanoid(), state: 'transition moveAway' })
			if (!canvas) {
				emitToast('Could not find canvas', {
					type: 'error',
					autoClose: 2000,
				})
				return
			}
			startCanvasRecording(canvas as HTMLCanvasElement, {
				localStream: agoraStreamData?.stream as MediaStream,
				remoteStreams: agoraStreamData?.audios as MediaStream[],
			})
			// resetting the contionuous recorded block ids
			setContinuousRecordedBlockIds([])
		} catch (e) {
			console.log(e)
		}
	}

	const updateRecordedBlocks = (blocks: { [key: string]: string }) => {
		setRecordedBlocks(blocks)
		broadcast({
			type: RoomEventTypes.UpdateRecordedBlocks,
			payload: blocks,
		})
	}

	// function which gets triggered on stop, used for converting the blobs in to url and
	// store it in recorded blocks and checking if the blobs are empty
	const prepareVideo = async () => {
		const currentBlockDataConfig = dataConfig[activeObjectIndex]
		console.log('Preparing video...')
		const blob = await getBlobs()
		if (!blob || blob?.size <= 0) {
			updateState('resumed')
			emitToast('Could not produce the video', {
				type: 'error',
				autoClose: 2000,
			})
			// Sentry.captureException(
			// 	new Error(
			// 		`Could not produce the video.Failed to get blobs when preparing video. ${JSON.stringify(
			// 			{
			// 				blobSize: blob?.size,
			// 				user: sub,
			// 				currentBlock: current,
			// 			}
			// 		)}`
			// 	)
			// )
			return
		}
		const url = URL.createObjectURL(blob)
		updateRecordedBlocks({
			...recordedBlocks,
			[currentBlockDataConfig.id]: url,
		})
		updateState('preview')
	}

	const upload = async (blockId: string) => {
		const toast = emitToast(
			'Pushing pixels... \n Our hamsters are gift-wrapping your Fragment. Do hold. :)',
			{
				type: 'info',
				autoClose: false,
			}
		)

		try {
			const uploadVideoFile = await getBlobs()
			resetCanvas()
			if (!uploadVideoFile) throw Error('Blobs is undefined')

			const duration = await getBlobDuration(uploadVideoFile)
			const { uuid: objectUrl } = await uploadFile({
				extension: 'webm',
				file: uploadVideoFile,
				tag: UploadType.Block,
				meta: {
					flickId,
					fragmentId,
					recordingId,
					blockId,
				},
				handleProgress: ({ percentage }) => {
					updateToast(toast, `Pushing pixels... (${percentage}%)`, {
						type: 'info',
						autoClose: false,
					})
				},
			})
			let thumbnailFilename: string | null = null
			// Upload block thumbnail
			if (blockThumbnails.current[blockId]) {
				const thumbnailBlob = await fetch(
					blockThumbnails.current[blockId]
				).then(r => r.blob())

				const { uuid } = await uploadFile({
					extension: 'png',
					file: thumbnailBlob,
					tag: UploadType.Asset,
					meta: {
						flickId,
						fragmentId,
					},
					handleProgress: ({ percentage }) => {
						updateToast(toast, `Pushing pixels... (${percentage}%)`, {
							type: 'info',
							autoClose: false,
						})
					},
				})
				thumbnailFilename = uuid
			}
			if (
				viewConfig.continuousRecording &&
				continuousRecordedBlockIds.length > 0
			) {
				// if continuous recording is enabled, mark all the blocks that were recorded in the current take as saved
				const tempContinousRecordedBlocks: { [key: string]: string } = {}
				continuousRecordedBlockIds.forEach(block => {
					tempContinousRecordedBlocks[block.blockId] = objectUrl
				})
				updateRecordedBlocks({
					...recordedBlocks,
					...tempContinousRecordedBlocks,
				})
				// save all continuous recorded blocks to hasura
				await saveMultiBlocks({
					blocks: continuousRecordedBlockIds.map(block => ({
						id: block.blockId,
						playbackDuration: block.duration,
						thumbnail: thumbnailFilename, // TODO: generate thumbnail for each block in continuous recording mode
					})),
					flickId,
					fragmentId,
					recordingId,
					url: objectUrl,
				})
			} else {
				// Once the block video is uploaded to s3 , save the block to the table
				await saveBlock({
					flickId,
					fragmentId,
					recordingId,
					objectUrl,
					thumbnail: thumbnailFilename || undefined,
					// TODO: Update creation meta and playbackDuration when implementing continuous recording
					blockId,
					playbackDuration: duration,
				})
				updateRecordedBlocks({ ...recordedBlocks, [blockId]: objectUrl })
			}
			dismissToast(toast)
		} catch (e) {
			console.error('Upload error : ', e)
			// Sentry.captureException(e)
			emitToast(
				'Upload failed.\n Click here to retry before recording another block.',
				{
					type: 'error',
					autoClose: false,
					onClick: () => upload(blockId),
				}
			)
		}
	}

	const stop = () => {
		const currentBlockDataConfig = dataConfig[activeObjectIndex]
		const thumbnailURL = stageRef.current?.toDataURL()
		if (thumbnailURL) {
			blockThumbnails.current[currentBlockDataConfig.id] = thumbnailURL
		}
		// if (dataConfig?.[payload?.activeObjectIndex].type !== 'outroBlock')
		// 	setTopLayerChildren({ id: nanoid(), state: 'transition moveIn' })
		// else {
		stopCanvasRecording()
		setTimeout(() => {
			if (isStudioController) prepareVideo()
		}, 250)
	}

	useEventListener(({ event }) => {
		if (event.type === RoomEventTypes.RetakeButtonClick) {
			resetCanvas()
			// setTopLayerChildren?.({ id: nanoid(), state: '' })
		}
		if (event.type === RoomEventTypes.SaveButtonClick) {
			// setTopLayerChildren?.({ id: nanoid(), state: '' })
		}
		if (event.type === RoomEventTypes.RequestControls) {
			if (isStudioController) {
				if (event.payload.requestorSub === '') return
				setControlsRequestorSub(event.payload.requestorSub)
				setOpenControlsApprovalModal(true)
			}
		}
		if (event.type === RoomEventTypes.ApproveRequestControls) {
			if (event.payload.requestorSub === user?.uid) {
				setIsStudioController(true)
			}
		}
		if (event.type === RoomEventTypes.RevokeControls) {
			if (isStudioController) {
				setIsStudioController(false)
			}
		}
		if (event.type === RoomEventTypes.UpdateRecordedBlocks) {
			setRecordedBlocks(event.payload)
		}
	})

	// Hooks
	const value = useMemo(
		() => ({
			start,
			stop,
		}),
		[start]
	)

	// on unmount changing the state back to ready
	useEffect(() => {
		if (recordedBlocks[dataConfig[activeObjectIndex].id]) {
			updateState('preview')
		} else {
			updateState('ready')
		}
		return () => {
			resetState('ready')
			resetActiveObjectIndex(0)
			if (agoraActions?.leave) agoraActions.leave()
			if (!agoraStreamData?.stream) return
			agoraStreamData.stream.getTracks().forEach(track => {
				track.stop()
			})
		}
	}, [])

	useEffect(() => {
		if (!flick?.owner) return
		if (flick.owner.sub === user?.uid) {
			setIsHost(true)
			setIsStudioController(true)
		}
	}, [flick?.owner])

	useEffect(() => {
		if (state === 'stopRecording') stop()
	}, [state])

	return (
		<StudioContext.Provider value={value}>
			<Countdown updateState={updateState} />
			<div className='flex flex-col w-screen h-screen overflow-hidden backdrop-blur-md bg-black/80'>
				<div className='flex h-12 w-full flex-row items-center justify-between bg-gray-800 px-5'>
					<button
						type='button'
						className='flex items-center gap-x-2 cursor-pointer'
						onClick={() => {
							setOpenStudio(false)
							if (agoraActions?.leave) agoraActions.leave()
							if (!agoraStreamData?.stream) return
							agoraStreamData.stream.getTracks().forEach(track => {
								track.stop()
							})
						}}
					>
						<IoArrowBackOutline className='text-gray-400 h-4 w-4' />
						<Text className='text-dark-title font-medium' textStyle='caption'>
							Go to Notebook
						</Text>
					</button>
					<Heading
						as='h1'
						textStyle='smallTitle'
						className='text-dark-title absolute left-0 right-0 mx-auto w-96 text-center truncate cursor-default'
					>
						{flickName}
					</Heading>
					<div className='flex gap-x-3 items-center'>
						{!isStudioController && (
							<Button
								disabled={state === 'recording'}
								colorScheme='dark'
								onClick={() => {
									broadcast({
										type: RoomEventTypes.RequestControls,
										payload: {
											requestorSub: user?.uid || '',
										},
									})
								}}
							>
								Request Control
							</Button>
						)}
						{isHost && !isStudioController && (
							<Button
								disabled={state === 'recording'}
								colorScheme='dark'
								onClick={() => {
									broadcast({
										type: RoomEventTypes.RevokeControls,
										payload: {},
									})
									setIsStudioController(true)
								}}
							>
								Revoke Control
							</Button>
						)}
						<MediaControls
							flickId={flickId}
							fragmentId={fragmentId}
							participantId={
								viewConfig.speakers.find(
									({ userSub }: { userSub: string }) => userSub === user?.uid
								)?.id
							}
						/>
						<PresenceAvatars />
					</div>
				</div>
				{state !== 'preview' ? (
					<div className='grid grid-cols-12 flex-1 items-center relative'>
						<div
							className={cx(
								'flex justify-center items-start col-span-8 col-start-3 w-full h-full pt-16',
								{
									'pt-8 col-span-4 col-start-5':
										viewConfig?.mode === 'Portrait',
								}
							)}
							ref={ref}
							id='canvasComponent'
						>
							<CanvasComponent
								bounds={bounds}
								dataConfig={dataConfig}
								viewConfig={viewConfig}
								isPreview={false}
								stage={stageRef}
								scale={viewConfig?.mode === 'Portrait' ? 0.9 : 1}
								canvasId='incredibleCanvas'
							/>
						</div>
						<Notes
							dataConfig={dataConfig}
							bounds={bounds}
							shortsMode={viewConfig?.mode === 'Portrait'}
						/>
						{isStudioController && (
							<RecordingControls
								dataConfig={dataConfig}
								viewConfig={viewConfig}
								shortsMode={viewConfig?.mode === 'Portrait'}
								isPreview={false}
								updateState={updateState}
								stageRef={stageRef}
								setContinuousRecordedBlockIds={setContinuousRecordedBlockIds}
							/>
						)}
					</div>
				) : (
					<div className='flex items-center justify-center flex-col w-full flex-1 pt-4'>
						{recordedBlocks && (
							<div
								style={{
									height: '80vh',
									width:
										viewConfig?.mode === 'Portrait'
											? `${window.innerHeight / 2.25}px`
											: `${window.innerWidth / 1.5}px`,
								}}
								className='flex justify-center items-center w-full flex-col'
							>
								{/* eslint-disable-next-line jsx-a11y/media-has-caption */}
								<video
									height='auto'
									className='w-full'
									controls
									autoPlay={false}
									src={(() => {
										const newSrc =
											recordedBlocks[dataConfig[activeObjectIndex].id] || ''
										if (newSrc.includes('blob')) return newSrc
										return `${storage.cdn}${newSrc}`
									})()}
									key={nanoid()}
								/>
								{isStudioController && (
									<div className='flex items-center rounded-md gap-x-2 mt-2 z-10 p-2 px-3'>
										{
											// if block already has a recording dont show save button
											// checks if the url in the recorded blocks is a blob url
											recordedBlocks[
												dataConfig[activeObjectIndex].id
											]?.includes('blob') && (
												// Save and continue button
												<Button
													leftIcon={<FiUpload size={14} />}
													onClick={() => {
														if (
															activeObjectIndex === undefined &&
															activeObjectIndex < 0
														)
															return
														// TODO move to the next block on click of save and continue
														broadcast({
															type: RoomEventTypes.SaveButtonClick,
															payload: {},
														})
														// TODO if we change the active object index we need to update the state
														// setTopLayerChildren?.({ id: nanoid(), state: '',})

														if (dataConfig?.[activeObjectIndex]?.id)
															// calls the upload function
															upload(dataConfig?.[activeObjectIndex]?.id)
														else {
															emitToast(
																'Something went wrong! Please try again later',
																{
																	type: 'error',
																}
															)
														}
													}}
												>
													Save and continue
												</Button>
											)
										}
										{/* Retake button */}
										<Button
											colorScheme='darker'
											leftIcon={<FiRotateCcw size={14} />}
											onClick={() => {
												const currentBlockURL =
													recordedBlocks[dataConfig[activeObjectIndex].id]
												if (currentBlockURL) {
													// if found in recordedBlocks, find if webm is duplicate (meaning its part of continuous recording)
													const isPartOfContinuousRecording =
														Object.keys(recordedBlocks).filter(
															key => recordedBlocks[key] === currentBlockURL
														).length > 1

													// this if handles the case when the retake button is clicked on a block that is part of continuous recording
													if (isPartOfContinuousRecording) {
														// call action to delete all blocks with currBlock.objectUrl
														if (!confirmMultiBlockRetake.current) {
															emitToast(
																'Are you sure?\nYou are about to delete the recordings of all blocks that were recorded continuously along with this block.This action cannot be undone. If you would like to continue press retake again.',
																{
																	type: 'warning',
																}
															)
															confirmMultiBlockRetake.current = true
															return
															// eslint-disable-next-line no-else-return
														} else {
															deleteBlockGroupMutation.mutateAsync({
																objectUrl: currentBlockURL,
																recordingId,
															})
															confirmMultiBlockRetake.current = false

															// remove all the blocks with the current block url in recordedBlocks
															const x = { ...recordedBlocks }
															Object.keys(recordedBlocks).forEach(block => {
																if (recordedBlocks[block] === currentBlockURL) {
																	delete x[block]
																}
															})
															updateRecordedBlocks(x)
														}
													} else {
														// deletes the current block id from recorded blocks
														const x = { ...recordedBlocks }
														delete x[dataConfig[activeObjectIndex].id]
														updateRecordedBlocks(x)
													}
													if (currentBlockURL.includes('blob'))
														URL.revokeObjectURL(currentBlockURL)
												}
												broadcast({
													type: RoomEventTypes.RetakeButtonClick,
													payload: {},
												})
												resetCanvas()
												updateState('resumed')
												// setTopLayerChildren?.({ id: nanoid(), state: '' })
											}}
										>
											Retake
										</Button>
									</div>
								)}
							</div>
						)}
					</div>
				)}
				<MiniTimeline dataConfig={dataConfig} updateState={updateState} />
			</div>
			{/* Controls request modal */}
			<Dialog
				open={isHost && openControlsApprovalModal}
				onClose={() => {
					setControlsRequestorSub('')
					setOpenControlsApprovalModal(false)
				}}
				className={cx(
					'rounded-lg mx-auto px-8 pt-8 pb-4 text-white',
					css`
						background-color: #27272a !important;
					`
				)}
			>
				<Dialog.Panel>
					<Dialog.Title className='font-main font-medium text-md text-gray-100'>
						Would you like to hand over the controls ?
					</Dialog.Title>
					<Button
						appearance='solid'
						type='button'
						size='small'
						className=''
						onClick={() => {
							broadcast({
								type: RoomEventTypes.ApproveRequestControls,
								payload: {
									requestorSub: controlsRequestorSub,
								},
							})
							setIsStudioController(false)
							setControlsRequestorSub('')
							setOpenControlsApprovalModal(false)
						}}
					>
						Approve
					</Button>
					<button
						type='button'
						className='text-red-500 font-main font-semibold'
						onClick={() => {
							setControlsRequestorSub('')
							setOpenControlsApprovalModal(false)
						}}
					>
						Reject
					</button>
				</Dialog.Panel>
			</Dialog>
		</StudioContext.Provider>
	)
}

export default Studio
