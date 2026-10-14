import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './presentation/styles/index.css'
import App from './presentation/App.tsx'
import { SignIn } from './application/auth/SignIn'
import { DemoAuthRepository } from './infrastructure/auth/DemoAuthRepository'
import { demoCredentials } from './infrastructure/auth/demoCredentials'
import { TutorService } from './application/tutors/TutorService'
import { LocalTutorRepository } from './infrastructure/tutors/LocalTutorRepository'
import { LocalPetRepository } from './infrastructure/pets/LocalPetRepository'
import { PetService } from './application/pets/PetService'
import { ClinicalService } from './application/clinical/ClinicalService'
import { LocalClinicalRepository } from './infrastructure/clinical/LocalClinicalRepository'
import { localToday } from './presentation/utils/calendarDate'

const signIn = new SignIn(new DemoAuthRepository())
const tutorRepository = new LocalTutorRepository(() => window.localStorage)
const petRepository = new LocalPetRepository(() => window.localStorage)
const tutors = new TutorService(
  tutorRepository,
  () => crypto.randomUUID(),
  petRepository,
)
const pets = new PetService(petRepository, tutorRepository, () =>
  crypto.randomUUID(),
)
const clinical = new ClinicalService(
  new LocalClinicalRepository(() => window.localStorage),
  petRepository,
  () => crypto.randomUUID(),
  localToday,
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App
      signIn={signIn}
      initialCredentials={demoCredentials}
      tutors={tutors}
      pets={pets}
      clinical={clinical}
    />
  </StrictMode>,
)
