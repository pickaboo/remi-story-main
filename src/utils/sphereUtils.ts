import type { Sphere } from '../types';

export const isPersonalSphere = (sphere: Sphere): boolean => {
  return !!sphere.isPersonal;
}; 