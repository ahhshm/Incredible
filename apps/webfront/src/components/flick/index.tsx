import { Transition } from '@headlessui/react'
import { LiveMap, LiveObject } from '@liveblocks/client'
import { CoreEditorInstance, EditorProvider } from 'editor/src'
import parser from 'editor/src/utils/parser'
import { Block } from 'editor/src/utils/types'
import { Fragment, useEffect, useMemo } from 'react'
import { useRecoilCallback, useRecoilValue, useSetRecoilState } from 'recoil'
import { FlickFragment } from 'src/graphql/generated'
import {
	activeFragmentIdAtom,
	astAtom,
	flickAtom,
	flickNameAtom,
	openStudioAtom,
	participantsAtom,
	View,
	viewAtom,
} from 'src/stores/flick.store'
import {
	activeBrandIdAtom,
	brandingAtom,
	themeAtom,
	transitionAtom,
} from 'src/stores/studio.store'
import {
	Presence,
	PresencePage,
	RoomProvider,
} from 'src/utils/liveblocks.config'
import { useUser } from 'src/utils/providers/auth'
import EditorSection from './core/EditorSection'
import Navbar from './core/Navbar'
import ViewConfigUpdater from './core/ViewConfigUpdater'
import Preview from './preview/Preview'
import Timeline from './preview/Timeline'
import StudioHoC from './studio/StudioHoc'
import SubHeader from './subheader/SubHeader'

const FlickBody = ({
	flick,
	initialFragmentId,
}: {
	flick: FlickFragment
	initialFragmentId: string | null
}) => {
	const setStoresInitially = useRecoilCallback(
		({ set }) =>
			() => {
				const ast = flick.fragments.find(
					fragment => fragment.id === initialFragmentId
				)?.editorState
				set(flickAtom, {
					id: flick.id,
					owner: {
						id: flick.ownerId,
						sub: flick.owner?.userSub as string,
					},
				})
				set(flickNameAtom, flick.name)
				set(activeFragmentIdAtom, initialFragmentId)
				set(astAtom, ast ?? null)
				set(participantsAtom, flick.participants)
				set(brandingAtom, flick.useBranding ? flick.branding?.branding : {})
				set(activeBrandIdAtom, flick.useBranding ? flick.branding?.id : null)
				set(transitionAtom, flick.configuration?.transitions)
				set(themeAtom, flick.theme)
			},
		[]
	)

	useEffect(() => {
		setStoresInitially()
	}, [setStoresInitially])

	const { user } = useUser()
	const activeFragmentId = useRecoilValue(activeFragmentIdAtom)
	const view = useRecoilValue(viewAtom)
	const openStudio = useRecoilValue(openStudioAtom)

	const initialPresence: Presence = useMemo(
		() => ({
			user: {
				id: user?.uid as string,
				name: user?.displayName as string,
				picture: user?.picture as string,
			},
			page: PresencePage.Notebook,
			cursor: { x: 0, y: 0 },
			inHuddle: false,
		}),
		[user?.uid, user?.displayName, user?.picture]
	)

	const setAST = useSetRecoilState(astAtom)
	const handleEditorChange = (editor: CoreEditorInstance) => {
		parser({ editorJSON: editor.getJSON() }).then(({ ast }) => {
			if (ast)
				setAST(prev => ({
					...ast,
					blocks: [
						// eslint-disable-next-line no-nested-ternary
						...(prev?.blocks
							? prev?.blocks[0]?.type === 'introBlock'
								? [prev.blocks[0]]
								: []
							: []),
						...ast.blocks,
						// eslint-disable-next-line no-nested-ternary
						...(prev?.blocks
							? // eslint-disable-next-line no-unsafe-optional-chaining
							  prev?.blocks?.[prev?.blocks.length - 1]?.type === 'outroBlock'
								? [
										{
											...prev.blocks[prev.blocks.length - 1],
											pos: ast.blocks.length + 1,
										} as Block,
								  ]
								: []
							: []),
					],
				}))
			if (!editor || editor.isDestroyed) return
			const transaction = editor.state.tr
			editor.state.doc.descendants((node, pos) => {
				const { id } = node.attrs
				if (node.attrs.id !== id) {
					transaction.setNodeMarkup(pos, undefined, {
						...node.attrs,
						id,
					})
				}
			})
			transaction.setMeta('preventUpdate', true)
			editor.view.dispatch(transaction)
		})
	}

	if (!activeFragmentId) return null

	return (
		<RoomProvider
			id={`story-${flick.id}`}
			initialPresence={initialPresence}
			initialStorage={() => ({
				viewConfig: new LiveMap(),
				payload: new LiveMap(),
				activeObjectIndex: new LiveObject({ activeObjectIndex: 0 }),
				state: new LiveObject({ state: 'ready' }),
				studioControls: new LiveObject(),
				recordedBlocks: new LiveMap(),
			})}
		>
			<EditorProvider
				handleUpdate={handleEditorChange}
				displayName={user?.displayName || 'Anonymous'}
				documentId={activeFragmentId as string}
			>
				<div className='flex flex-col h-screen overflow-hidden'>
					<Navbar />
					<SubHeader />
					{view === View.Notebook ? <EditorSection /> : <Preview centered />}
					<Timeline persistentTimeline={false} shouldScrollToCurrentBlock />
					<ViewConfigUpdater />
				</div>
			</EditorProvider>

			<Transition
				show={openStudio}
				as={Fragment}
				enter='transition ease-out duration-200'
				enterFrom='transform opacity-0'
				enterTo='transform opacity-100'
				leave='transition ease-in duration-200'
				leaveFrom='transform opacity-100'
				leaveTo='transform opacity-0'
			>
				<div className='absolute top-0 left-0 w-full h-screen z-50'>
					<StudioHoC fragmentId={activeFragmentId} flickId={flick.id} />
				</div>
			</Transition>
		</RoomProvider>
	)
}

export default FlickBody
