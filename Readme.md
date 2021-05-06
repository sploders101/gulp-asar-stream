# gulp-asar-stream

This module provides an interface for working with asar files in gulp. Currently, only the writing half has been implemented, but I expect to create a reader that extracts archives, pushing them out as Vinyl files.

## `GulpAsarWriter`

This interface provides the writing end of the module. It pulls in any files piped into it, and adds them to an asar archive, emitting one file once the input stream has ended.

This module uses asar-flex to build the asar archive, which means it streams the files through. In order to support this though, the entire pipeline must support streaming. If it does not, the data will be buffered into RAM until the pipeline finishes. If this becomes a problem, files could be saved to disk intermediately and then streamed back through into the archive. More notes on this below.

### Constructor

```typescript
export class GulpAsarWriter extends Transform {
    constructor(filename: string, opts?: GulpAsarWriter.Options);
	// ...
}
```

The constructor requires one argument, which is the name of the resulting asar file. An optional options argument can be provided to enable warnings and debugging information.

### Example
```typescript
import gulp from "gulp";
import typescript from "gulp-typescript";
import {
	GulpAsarWriter,
} from "gulp-asar-stream";

gulp.task("archiveFiles", () => {
	return gulp.src("src/**/*.ts") // Pull in ts files
		.pipe(typescript()) // Transpile into js
		.pipe(new GulpAsarWriter("app.asar")) // Write them into an asar archive named app.asar
		.pipe(gulp.dest("dist")) // Save it in the dist folder
});
```

### A note on memory usage

This plugin can either be much better, or the same as the offical implementation, depending on your use case. If you want to stream files from an online source directly into your archive, this will do that. If you want to eliminate the need to create a temporary dist folder before archiving your source files, this will do that. However, in order to prevent consuming mass amounts of ram, make sure that your data is streaming data before piping it through. Because of the nature of the asar format, the metadata of all files must be written *first*, meaning that we cannot write *anything* until we have *seen* *everything*. The memory implications of this are largely mitigated by collecting only the metadata in the Vinyl objects, and leaving the streams within them untouched, allowing flow control to do its work and keep them at bay until we're ready for the data. Unfortunately, many plugins output buffers, which could be problematic when dealing with large amounts of files. If this is the case, and you start to notice abnormally high memory usage, you should pipe files to an intermediate folder before archiving.

If you would like to know if the files are being buffered before they are passed along, you can pass a second, optional argument to the writer class, like so:
```typescript
return gulp.src("**/*.ts")
	.pipe(typescript())
	.pipe(new GulpAsarWriter("app.asar", { warnBuffers: true }));
	.pipe(gulp.dest("dist"));
```
