import type { NextPage } from 'next'
import { useEffect, useState } from 'react'
import { piLogin } from '../lib/pi/pi-sdk'

const Home: NextPage = () => {
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const login = async () => {
      const result = await piLogin()
      setUser(result)
    }
    login()
  }, [])

  return (
    <div>
      <h1>Welcome to TEC Frontend</h1>
      {user ? (
        <p>Logged in as {user.piId}</p>
      ) : (
        <p>Logging in...</p>
      )}
    </div>
  )
}

export default Home
