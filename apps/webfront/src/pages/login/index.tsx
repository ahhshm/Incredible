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

import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import NextLink from 'next/link'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { IoLogoGoogle } from 'react-icons/io5'
import Container from 'src/components/core/Container'
import useReplace from 'src/utils/hooks/useReplace'
import { useUser } from 'src/utils/providers/auth'
import Logo from 'svg/Logo.svg'
import { Button, Heading, ScreenState, Text } from 'ui/src'

const LoginPage = () => {
	const { query } = useRouter()
	const replace = useReplace()
	const { user, loadingUser } = useUser()

	useEffect(() => {
		if (user) {
			if (user.onboarded) {
				if (query.continue && typeof query.continue === 'string') {
					replace(query.continue)
					return
				}
				replace('/dashboard')
			} else {
				replace('/onboarding')
			}
		}
	}, [user, replace, query])

	if (loadingUser || user) return <ScreenState title='Checking session' />

	return (
		<Container title='Incredible | Login'>
			<div className='relative flex flex-col items-center h-screen'>
				<div className='m-4 absolute top-0 left-0'>
					<NextLink href='/'>
						<Logo />
					</NextLink>
				</div>
				<div className='flex justify-center items-center w-full px-6 md:px-0 md:w-[520px]  h-screen'>
					<div className='flex flex-col'>
						<Heading
							textStyle='heading'
							className='text-dark-title font-bold sm:text-[40px] sm:leading-[50px]'
						>
							Create developer content in record time
						</Heading>
						<Text textStyle='body' className='mt-4 text-dark-title-200'>
							Create developer content in record time for multiple distribution
							channels and grow your community!
						</Text>

						<Button
							className='max-w-none mt-8 text-size-md py-2.5'
							size='large'
							leftIcon={<IoLogoGoogle />}
							onClick={async () => {
								const provider = new GoogleAuthProvider()
								await signInWithPopup(getAuth(), provider)
							}}
						>
							Sign In
						</Button>
					</div>
				</div>
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img
					src='pattern.svg'
					alt='Incredible'
					className='absolute bottom-0 right-0 h-36 sm:h-auto'
				/>
			</div>
		</Container>
	)
}

export default LoginPage
