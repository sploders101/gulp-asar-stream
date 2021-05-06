import gulp from "gulp";
import { GulpAsarWriter } from "../src/writer";

gulp.task("default", () => {
	return gulp.src("src/**/*")
		.pipe(new GulpAsarWriter("test.asar"))
		.pipe(gulp.dest("dist"));
});
