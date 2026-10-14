import { useState } from 'react'
import type { SignIn } from '../application/auth/SignIn'
import type { Credentials } from '../application/auth/Credentials'
import type { User } from '../domain/auth/User'
import { LoginPage } from './pages/LoginPage'
import { WelcomePage } from './pages/WelcomePage'
import './styles/App.css'
import './styles/Tutors.css'
import { AppShell, type PanelPage } from './components/AppShell'
import { TutorsPage } from './pages/tutors/TutorsPage'
import type { TutorService } from '../application/tutors/TutorService'
import type { PetService } from '../application/pets/PetService'
import { PetsPage } from './pages/pets/PetsPage'
import './styles/Pets.css'
import './styles/Clinical.css'
import type { ClinicalService } from '../application/clinical/ClinicalService'
import { ClinicalPage } from './pages/clinical/ClinicalPage'

function App({
  signIn,
  initialCredentials,
  tutors,
  pets,
  clinical,
}: {
  signIn: SignIn
  initialCredentials: Readonly<Credentials>
  tutors: TutorService
  pets: PetService
  clinical: ClinicalService
}) {
  const [user, setUser] = useState<User | null>(null)
  const [page, setPage] = useState<PanelPage>('welcome')
  return user ? (
    <AppShell
      user={user}
      activePage={page}
      onNavigate={setPage}
      onSignOut={() => {
        setUser(null)
        setPage('welcome')
      }}
    >
      {page === 'welcome' ? (
        <WelcomePage user={user} />
      ) : page === 'tutors' ? (
        <TutorsPage service={tutors} />
      ) : page === 'pets' ? (
        <PetsPage service={pets} tutorService={tutors} />
      ) : (
        <ClinicalPage
          service={clinical}
          petService={pets}
          tutorService={tutors}
        />
      )}
    </AppShell>
  ) : (
    <LoginPage
      signIn={signIn}
      initialCredentials={initialCredentials}
      onSignIn={setUser}
    />
  )
}

export default App
