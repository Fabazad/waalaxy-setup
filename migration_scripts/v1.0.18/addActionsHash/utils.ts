import { nanoid } from 'nanoid';

export const generateActionHash = (): string => nanoid(32);
