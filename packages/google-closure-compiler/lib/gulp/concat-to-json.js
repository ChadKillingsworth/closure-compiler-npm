/*
 * Copyright 2015 The Closure Compiler Authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Convert an array of vinyl files to
 * an Array of records. These records will be later be converted to a JSON
 * string to pass to closure-compiler
 *
 * @author Chad Killingsworth (chadkillingsworth@gmail.com)
 */

import path from 'node:path';
import File from 'vinyl';

/**
 * @param {string} src
 * @param {string=} filepath
 * @param {string=} sourceMap
 * @return {{
 *   src: string,
 *   path: string|undefined,
 *   sourceMap: string|undefined,
 * }}
 */
const createJsonFileRecord = (src, filepath, sourceMap) => ({
  src: src,
  ...(filepath !== undefined ? {path: filepath} : undefined),
  ...(sourceMap !== undefined ? {sourceMap} : undefined),
});

/**
 * @param {!Array<!File>} files
 * @return {!Array<!{
 *   src: string,
 *   path: string|undefined,
 *   sourceMap: string|undefined,
 * }>}
 */
export default (files) => files.map((file) =>
    createJsonFileRecord(
      file.contents.toString(),
      file.relative || path.relative(process.cwd(), file.path),
      file.sourceMap ? JSON.stringify(file.sourceMap) : undefined,
    )
);
