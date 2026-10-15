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
import type { GuidedStoryRepository } from '../application/guidedStory/GuidedStoryRepository'
import { GuidedStoryExperience } from './components/GuidedStoryExperience'
import './styles/GuidedStory.css'
import type { PresentationDataReset } from '../application/demo/PresentationDataReset'
import { ResetPresentationData } from './components/ResetPresentationData'
import './styles/PresentationReset.css'

function App({
  signIn,
  initialCredentials,
  tutors,
  pets,
  clinical,
  storyRepository,
  presentationReset,
}: {
  signIn: SignIn
  initialCredentials: Readonly<Credentials>
  tutors: TutorService
  pets: PetService
  clinical: ClinicalService
  storyRepository: GuidedStoryRepository
  presentationReset: PresentationDataReset
}) {
  const [user, setUser] = useState<User | null>(null)
  const [page, setPage] = useState<PanelPage>('welcome')
  const [clinicalPetId, setClinicalPetId] = useState<string>()
  const [presentationRevision, setPresentationRevision] = useState(0)
  function navigate(next: PanelPage) {
    setClinicalPetId(undefined)
    setPage(next)
  }
  function viewHistory(petId: string) {
    setClinicalPetId(petId)
    setPage('clinical')
  }
  return user ? (
    <AppShell
      user={user}
      activePage={page}
      onNavigate={navigate}
      onSignOut={() => {
        setUser(null)
        setPage('welcome')
        setClinicalPetId(undefined)
      }}
    >
      <GuidedStoryExperience
        key={presentationRevision}
        repository={storyRepository}
        tutors={tutors}
        pets={pets}
        clinical={clinical}
        page={page}
        onNavigate={navigate}
        onViewHistory={viewHistory}
      >
        {(revision) =>
          page === 'welcome' ? (
            <WelcomePage key={`welcome-${revision}`} user={user} />
          ) : page === 'tutors' ? (
            <TutorsPage key={`tutors-${revision}`} service={tutors} />
          ) : page === 'pets' ? (
            <PetsPage
              key={`pets-${revision}`}
              service={pets}
              tutorService={tutors}
            />
          ) : (
            <ClinicalPage
              key={`clinical-${revision}-${clinicalPetId ?? 'all'}`}
              service={clinical}
              petService={pets}
              tutorService={tutors}
              initialPetId={clinicalPetId}
            />
          )
        }
      </GuidedStoryExperience>
      {page === 'welcome' && (
        <ResetPresentationData
          resetter={presentationReset}
          onReset={() => {
            setClinicalPetId(undefined)
            setPresentationRevision((current) => current + 1)
          }}
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
