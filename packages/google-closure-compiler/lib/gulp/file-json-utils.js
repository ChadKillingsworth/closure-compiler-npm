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
 * @param {!Array<!File>} files
 * @return {!Array<!{
 *   src: string,
 *   path: string|undefined,
 *   sourceMap: string|undefined,
 * }>}
 */
export const filesToJson = (files) =>
    files.map((file) => ({
      src: file.src,
      path: file.relative || path.relative(process.cwd(), file.path),
      ...(file.sourceMap !== undefined ? {sourceMap: JSON.stringify(file.sourceMap)} : undefined),
    }));


/**
 * @param {!Array<!{
 *     path: string,
 *     src: string,
 *     source_map: (string|undefined),
 *     sourceMap: (string|undefined),
 *   }>} fileList array of file objects
 * @return {!Array<!File>}
 */
export const jsonToFiles = (fileList) =>
    fileList.map((fileRecord) => {
      const file = new File({
        path: fileRecord.path,
        contents: Buffer.from(fileRecord.src, 'utf8'),
      });
      if (fileRecord.source_map ?? fileRecord.sourceMap) {
        file.sourceMap = JSON.parse(fileRecord.source_map ?? fileRecord.sourceMap);
      }
      return file;
    });
