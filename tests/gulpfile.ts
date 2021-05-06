import gulp from "gulp";
import {
	GulpAsarWriter,
} from "../src/writer";

gulp.task("default", () => {
	return gulp.src("src/**/*", {
		buffer: false,
	})
		.pipe(new GulpAsarWriter("test.asar", {
			warnBuffers: true,
		}))
		.pipe(gulp.dest("dist"));
});
