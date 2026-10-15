import type { Tutor } from '../../domain/tutors/Tutor'

// Personas y contactos ficticios, exclusivamente para la demostración.
export const demoTutors: Tutor[] = [
  {
    id: 'tutor-1',
    firstName: 'Lucía',
    lastName: 'Ramírez Torres',
    dni: '00000001',
    phone: '900000001',
    email: 'lucia@example.com',
    address: 'Av. José Larco',
    district: 'Miraflores',
    pets: [
      { id: 'pet-1', name: 'Luna', species: 'Perro' },
      { id: 'pet-2', name: 'Milo', species: 'Gato' },
    ],
  },
  {
    id: 'tutor-2',
    firstName: 'Diego',
    lastName: 'Vargas Medina',
    dni: '00000002',
    phone: '900000002',
    email: 'diego@example.com',
    address: 'Av. San Borja Norte',
    district: 'San Borja',
    pets: [{ id: 'pet-3', name: 'Rocky', species: 'Perro' }],
  },
  {
    id: 'tutor-3',
    firstName: 'Valeria',
    lastName: 'Rojas Castillo',
    dni: '00000003',
    phone: '900000003',
    email: 'valeria@example.com',
    address: 'Av. Caminos del Inca',
    district: 'Surco',
    pets: [{ id: 'pet-4', name: 'Nala', species: 'Gato' }],
  },
]
