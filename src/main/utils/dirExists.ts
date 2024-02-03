import { accessSync, constants } from 'fs';

export const dirExistsSync = (dir: string, mode = constants.F_OK) => {
  try {
    accessSync(dir, mode);
    return true;
  } catch (error) {
    if ('code' in (error as any)) {
      switch ((error as NodeJS.ErrnoException).code) {
        case 'ENOENT':
          // Requested location doesn't exist.
          break;
        case 'EEXIST':
          // Requested location already exists, but it's not a directory.
          break;
        case 'ENOTDIR':
          // The parent hierarchy contains a file with the same name as the dir
          // you're trying to create.
          break;
        default:
          // Some other error like permission denied.
          console.error(error);
          break;
      }
    }
    return false;
  }
};
