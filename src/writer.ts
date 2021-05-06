import {
	AsarWriter,
} from "asar-flex";
import Vinyl from "vinyl";
import {
	Transform,
} from "stream";
import {
	S_IXUSR,
	S_IXGRP,
	S_IXOTH,
} from "constants";

const ANYEXEC = S_IXUSR | S_IXGRP | S_IXOTH;

export namespace GulpAsarWriter {
	export interface Options {
		warnBuffers: boolean;
	}
}

export class GulpAsarWriter extends Transform {
	files = new Map<string, Vinyl>();
	filename: string;
	private warnBuffers = false;

	constructor(filename: string, opts?: GulpAsarWriter.Options) {
		super({
			objectMode: true,
		});
		this.filename = filename;

		if(opts) {
			if(opts.warnBuffers) this.warnBuffers = true;
		}
	}

	_transform(chunk: Vinyl, encoding: string | undefined, cb: (err?: Error) => void) {
		if(chunk.isSymbolic()) {
			return cb(new Error ("Symbolic links are not yet supported"));
		} else if(false
			|| chunk.isBuffer()
			|| chunk.isStream()
			|| chunk.isDirectory()
		) {
			if(this.warnBuffers && Buffer.isBuffer(chunk.contents)) {
				console.warn(`${chunk.path}: File is a buffer. It is recommended to use streams to take advantage of flow control and keep memory usage down.`);
			}
			this.files.set(chunk.relative, chunk);
			return cb();
		} else if(chunk.isNull()) {
			return cb(new Error("Null files are not supported"));
		}
	}

	_final(cb: (err?: Error) => void) {
		try {
			const writer = new AsarWriter();
			let base: string | null = null;
			for(const file of this.files.values()) {
				if(!base) base = file.base;
				if(file.isDirectory()) {
					writer.mkdir(file.relative);
				} else if(file.isBuffer() || file.isStream) {
					const size = this.getFileSize(file);
					writer.addFile({
						path: file.relative,
						size,
						stream: file.contents,
						attributes: {
							executable: Boolean(file.stat.mode & ANYEXEC),
						},
					});
				}
			}
			this.push(new Vinyl({
				cwd: base,
				contents: writer.createAsarStream(),
				path: `${base.replace(/\/$/, "")}/${this.filename.replace(/^\//, "")}`,
			}));
			this.push(null);
			cb();
		} catch(err) {
			cb(err);
		}
	}

	private getFileSize(file: Vinyl) {
		if(file.isBuffer()) {
			return file.contents.length
		} else if(file.isStream() && file.stat && typeof(file.stat.size) === "number") {
			return file.stat.size;
		} else {
			throw new Error(`Could not determine size of ${file.relative}`);
		}
	}
}
