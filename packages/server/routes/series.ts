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

import { TRPCError } from '@trpc/server'
import * as trpc from '@trpc/server'
import { z } from 'zod'

import { FlickScopeEnum } from 'utils/src/enums'
import { Context } from '../createContext'
import { Meta } from '../utils/helpers'

const seriesRouter = trpc
	.router<Context, Meta>()
	/*
		AUTH CHECK MIDDLEWARE

		Note: Certain routes that don't require authentication can be excluded from this middleware
		by passing meta.hasAuth = false.
	*/
	.middleware(({ meta, ctx, next }) => {
		// only check authorization if enabled
		if (meta?.hasAuth && !ctx.user) {
			throw new TRPCError({
				code: 'UNAUTHORIZED',
				message: 'Invalid Auth Token',
			})
		}
		return next({
			ctx: {
				...ctx,
				user: ctx.user,
			},
		})
	})
	.query('get', {
		meta: {
			hasAuth: true,
		},
		input: z.object({
			id: z.string(),
		}),
		resolve: async ({ ctx, input }) => {
			if (!ctx.user?.sub) {
				throw new TRPCError({
					code: 'UNAUTHORIZED',
					message: 'Invalid Auth Token',
				})
			}
			const series = await ctx.prisma.series.findFirst({
				where: {
					id: input.id,
					OR: [
						{
							scope: FlickScopeEnum.Public,
						},
						{
							ownerSub: ctx.user.sub,
						},
						{
							Flick_Series: {
								some: {
									Flick: {
										Participants: {
											some: {
												userSub: ctx.user!.sub,
											},
										},
									},
								},
							},
						},
					],
				},
				select: {
					id: true,
					name: true,
					description: true,
					picture: true,
					createdAt: true,
					updatedAt: true,
					scope: true,
					User: {
						select: {
							displayName: true,
							username: true,
							picture: true,
							sub: true,
						},
					},
					Flick_Series: {
						select: {
							Flick: {
								select: {
									id: true,
									status: true,
									name: true,
									description: true,
									thumbnail: true,
									configuration: true,
									ownerSub: true,
									joinLink: true,
									topicTags: true,
									publishedAt: true,
									Content: {
										select: {
											id: true,
											isPublic: true,
											type: true,
											resource: true,
											thumbnail: true,
											published_at: true,
										},
									},
									Participants: {
										select: {
											id: true,
											userSub: true,
											User: {
												select: {
													sub: true,
													displayName: true,
													username: true,
													picture: true,
												},
											},
										},
									},
								},
							},
						},
					},
				},
			})
			if (!series) {
				throw new TRPCError({
					code: 'NOT_FOUND',
				})
			}

			return series
		},
	})
	.query('dashboard', {
		meta: {
			hasAuth: true,
		},
		input: z.object({
			limit: z.number().max(25).min(1).nullish(),
			cursor: z.string().nullish(),
		}),
		resolve: async ({ ctx, input }) => {
			const limit = input.limit || 25
			const cursor = input.cursor || null

			if (!ctx.user?.sub)
				throw new TRPCError({
					code: 'UNAUTHORIZED',
				})
			const series = await ctx.prisma.series.findMany({
				where: {
					OR: [
						{
							ownerSub: ctx.user.sub,
						},
						{
							Flick_Series: {
								some: {
									Flick: {
										Participants: {
											some: {
												userSub: ctx.user.sub,
											},
										},
									},
								},
							},
						},
					],
				},
				select: {
					id: true,
					name: true,
					description: true,
					picture: true,
					createdAt: true,
					ownerSub: true,
				},
				take: limit,
				cursor: cursor ? { id: cursor } : undefined,
				orderBy: {
					createdAt: 'desc',
				},
			})
			let nextCursor: typeof cursor | null = null
			if (series.length > limit) {
				const nextSeries = series.pop()
				nextCursor = nextSeries!.id
			}
			return { nextCursor, series }
		},
	})
	.query('getSubsCount', {
		meta: {
			hasAuth: true,
		},
		input: z.object({
			id: z.string(),
		}),
		resolve: async ({ ctx, input }) => {
			const subs = await ctx.prisma.subscription.count({
				where: {
					seriesId: input.id,
				},
			})
			return { count: subs }
		},
	})
	.query('getStarCount', {
		meta: {
			hasAuth: true,
		},
		input: z.object({
			id: z.string(),
		}),
		resolve: async ({ ctx, input }) => {
			const stars = await ctx.prisma.series_Stars.count({
				where: {
					seriesId: input.id,
				},
			})
			return { count: stars }
		},
	})
	.query('hasStarred', {
		meta: {
			hasAuth: true,
		},
		input: z.object({
			id: z.string(),
		}),
		resolve: async ({ ctx, input }) => {
			if (!ctx.user?.sub)
				throw new TRPCError({
					code: 'UNAUTHORIZED',
				})
			const starred = await ctx.prisma.series_Stars.findFirst({
				where: {
					seriesId: input.id,
					userId: ctx.user.sub,
				},
				select: {
					seriesId: true,
				},
			})
			return !!starred
		},
	})
	.query('hasSubscribed', {
		meta: {
			hasAuth: true,
		},
		input: z.object({
			id: z.string(),
		}),
		resolve: async ({ ctx, input }) => {
			if (!ctx.user?.sub)
				throw new TRPCError({
					code: 'UNAUTHORIZED',
				})
			const sub = await ctx.prisma.subscription.findFirst({
				where: {
					seriesId: input.id,
					userSub: ctx.user.sub,
				},
				select: {
					seriesId: true,
				},
			})
			return !!sub
		},
	})
	.mutation('add', {
		meta: {
			hasAuth: true,
		},
		input: z.object({
			storyIds: z.array(z.string()).min(1),
			seriesId: z.string(),
		}),
		resolve: async ({ ctx, input }) => {
			if (!ctx.user?.sub)
				throw new TRPCError({
					code: 'UNAUTHORIZED',
				})
			const addMany = await ctx.prisma.flick_Series.createMany({
				data: input.storyIds.map((storyId, idx) => ({
					seriesId: input.seriesId,
					flickId: storyId,
					order: idx,
				})),
			})
			if (addMany.count !== input.storyIds.length) {
				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
					message: 'One or more stories could not be added to the series',
				})
			}
			return { success: true, count: addMany.count }
		},
	})
	.mutation('create', {
		meta: {
			hasAuth: true,
		},
		input: z.object({
			name: z.string(),
			description: z.string(),
		}),
		resolve: async ({ ctx, input }) => {
			if (!ctx.user?.sub)
				throw new TRPCError({
					code: 'UNAUTHORIZED',
				})
			const series = await ctx.prisma.series.create({
				data: {
					...input,
					ownerSub: ctx.user.sub,
				},
				select: {
					id: true,
				},
			})
			return series
		},
	})
	.mutation('star', {
		meta: {
			hasAuth: true,
		},
		input: z.object({
			id: z.string(),
		}),
		resolve: async ({ ctx, input }) => {
			if (!ctx.user?.sub)
				throw new TRPCError({
					code: 'UNAUTHORIZED',
				})

			const star = await ctx.prisma.series_Stars.create({
				select: {
					seriesId: true,
				},
				data: {
					userId: ctx.user.sub,
					seriesId: input.id,
				},
			})
			if (!star) {
				throw new TRPCError({
					code: 'CONFLICT',
				})
			}

			return {
				success: true,
			}
		},
	})
	.mutation('unstar', {
		meta: {
			hasAuth: true,
		},
		input: z.object({
			id: z.string(),
		}),
		resolve: async ({ ctx, input }) => {
			if (!ctx.user?.sub)
				throw new TRPCError({
					code: 'UNAUTHORIZED',
				})

			const unstar = await ctx.prisma.series_Stars.delete({
				where: {
					userId_seriesId: {
						userId: ctx.user.sub,
						seriesId: input.id,
					},
				},
				select: {
					seriesId: true,
				},
			})
			if (!unstar) {
				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
				})
			}

			return {
				success: true,
			}
		},
	})
	.mutation('subscribe', {
		meta: {
			hasAuth: false,
		},
		input: z.object({
			id: z.string(),
			email: z.string().optional(),
		}),
		resolve: async ({ ctx, input }) => {
			if (!input.email && (!ctx.user?.sub || !ctx.user?.email)) {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'Email is required',
				})
			}
			const sub = await ctx.prisma.subscription.findFirst({
				where: {
					seriesId: input.id,
					email: input.email,
				},
			})
			if (sub) {
				return {
					success: true,
					alreadyExists: true,
				}
			}

			let userEmail: string = ''
			if (!input.email && !ctx.user?.email) {
				const data = await ctx.prisma.user.findUnique({
					where: {
						sub: ctx.user?.sub,
					},
					select: {
						email: true,
					},
				})
				if (!data?.email) {
					throw new TRPCError({
						code: 'INTERNAL_SERVER_ERROR',
						message: 'Please register with an email before subscribing',
					})
				}
				userEmail = data.email
			}

			const newSub = await ctx.prisma.subscription.create({
				data: {
					seriesId: input.id,
					email: input.email ? input.email : userEmail,
					userSub: ctx.user?.sub ? ctx.user.sub : undefined,
				},
			})
			if (!newSub) {
				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
				})
			}
			return {
				success: true,
				alreadyExists: false,
			}
		},
	})
	.mutation('unsubscribe', {
		meta: {
			hasAuth: false,
		},
		input: z.object({
			id: z.string(),
			email: z.string().optional(),
		}),
		resolve: async ({ ctx, input }) => {
			if (!input.email && (!ctx.user?.sub || !ctx.user?.email)) {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'Email is required',
				})
			}
			const sub = await ctx.prisma.subscription.findFirst({
				where: {
					seriesId: input.id,
					email: input.email,
				},
			})
			if (!sub) {
				throw new TRPCError({
					code: 'BAD_REQUEST',
					message: 'No subscription found',
				})
			}

			let userEmail: string = ''
			if (!input.email && !ctx.user?.email) {
				const data = await ctx.prisma.user.findUnique({
					where: {
						sub: ctx.user?.sub,
					},
					select: {
						email: true,
					},
				})
				if (!data?.email) {
					throw new TRPCError({
						code: 'INTERNAL_SERVER_ERROR',
						message: 'Please register with an email before subscribing',
					})
				}
				userEmail = data.email
			}

			const deleteSub = await ctx.prisma.subscription.deleteMany({
				where: {
					seriesId: input.id,
					email: input.email ? input.email : userEmail,
					userSub: ctx.user?.sub ? ctx.user.sub : undefined,
				},
			})
			if (deleteSub.count === 0) {
				throw new TRPCError({
					code: 'INTERNAL_SERVER_ERROR',
				})
			}
			return {
				success: true,
			}
		},
	})
export default seriesRouter
