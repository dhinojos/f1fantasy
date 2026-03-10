import type { Driver } from '@/types/domain';

export const PICK_POSITIONS = Array.from({ length: 10 }, (_, index) => index + 1);

export const DRIVER_FIXTURES: Driver[] = [
  {
    id: 'albon',
    code: 'ALB',
    fullName: 'Alex Albon',
    teamName: 'Williams',
    teamColor: '#005aff',
    carNumber: 23
  },
  {
    id: 'alonso',
    code: 'ALO',
    fullName: 'Fernando Alonso',
    teamName: 'Aston Martin',
    teamColor: '#006f62',
    carNumber: 14
  },
  {
    id: 'antonelli',
    code: 'ANT',
    fullName: 'Kimi Antonelli',
    teamName: 'Mercedes',
    teamColor: '#00d2be',
    carNumber: 12
  },
  {
    id: 'bearman',
    code: 'BEA',
    fullName: 'Oliver Bearman',
    teamName: 'Haas',
    teamColor: '#b6babd',
    carNumber: 87
  },
  {
    id: 'bortoleto',
    code: 'BOR',
    fullName: 'Gabriel Bortoleto',
    teamName: 'Audi',
    teamColor: '#ff2d00',
    carNumber: 5
  },
  {
    id: 'bottas',
    code: 'BOT',
    fullName: 'Valtteri Bottas',
    teamName: 'Cadillac',
    teamColor: '#52e252',
    carNumber: 77
  },
  {
    id: 'colapinto',
    code: 'COL',
    fullName: 'Franco Colapinto',
    teamName: 'Alpine',
    teamColor: '#0090ff',
    carNumber: 43
  },
  {
    id: 'gasly',
    code: 'GAS',
    fullName: 'Pierre Gasly',
    teamName: 'Alpine',
    teamColor: '#0090ff',
    carNumber: 10
  },
  {
    id: 'hadjar',
    code: 'HAD',
    fullName: 'Isack Hadjar',
    teamName: 'Red Bull',
    teamColor: '#3671c6',
    carNumber: 6
  },
  {
    id: 'hamilton',
    code: 'HAM',
    fullName: 'Lewis Hamilton',
    teamName: 'Ferrari',
    teamColor: '#dc0000',
    carNumber: 44
  },
  {
    id: 'hulkenberg',
    code: 'HUL',
    fullName: 'Nico Hulkenberg',
    teamName: 'Audi',
    teamColor: '#ff2d00',
    carNumber: 27
  },
  {
    id: 'lawson',
    code: 'LAW',
    fullName: 'Liam Lawson',
    teamName: 'Racing Bulls',
    teamColor: '#6692ff',
    carNumber: 30
  },
  {
    id: 'leclerc',
    code: 'LEC',
    fullName: 'Charles Leclerc',
    teamName: 'Ferrari',
    teamColor: '#dc0000',
    carNumber: 16
  },
  {
    id: 'lindblad',
    code: 'LIN',
    fullName: 'Arvid Lindblad',
    teamName: 'Racing Bulls',
    teamColor: '#6692ff',
    carNumber: 41
  },
  {
    id: 'norris',
    code: 'NOR',
    fullName: 'Lando Norris',
    teamName: 'McLaren',
    teamColor: '#ff8700',
    carNumber: 1
  },
  {
    id: 'ocon',
    code: 'OCO',
    fullName: 'Esteban Ocon',
    teamName: 'Haas',
    teamColor: '#b6babd',
    carNumber: 31
  },
  {
    id: 'perez',
    code: 'PER',
    fullName: 'Sergio Perez',
    teamName: 'Cadillac',
    teamColor: '#1e5bc6',
    carNumber: 11
  },
  {
    id: 'piastri',
    code: 'PIA',
    fullName: 'Oscar Piastri',
    teamName: 'McLaren',
    teamColor: '#ff8700',
    carNumber: 81
  },
  {
    id: 'russell',
    code: 'RUS',
    fullName: 'George Russell',
    teamName: 'Mercedes',
    teamColor: '#00d2be',
    carNumber: 63
  },
  {
    id: 'sainz',
    code: 'SAI',
    fullName: 'Carlos Sainz',
    teamName: 'Williams',
    teamColor: '#005aff',
    carNumber: 55
  },
  {
    id: 'stroll',
    code: 'STR',
    fullName: 'Lance Stroll',
    teamName: 'Aston Martin',
    teamColor: '#006f62',
    carNumber: 18
  },
  {
    id: 'verstappen',
    code: 'VER',
    fullName: 'Max Verstappen',
    teamName: 'Red Bull',
    teamColor: '#3671c6',
    carNumber: 3
  }
];
