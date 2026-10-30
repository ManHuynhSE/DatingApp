const { withProjectBuildGradle } = require('@expo/config-plugins');

const KOTLIN_VERSION = '2.3.20';

module.exports = function withKotlinGradlePlugin(config) {
  return withProjectBuildGradle(config, (config) => {
    let contents = config.modResults.contents;

    const pattern =
      /classpath\(['"]org\.jetbrains\.kotlin:kotlin-gradle-plugin(?:[^'"]*)['"]\)/;

    if (!pattern.test(contents)) {
      throw new Error(
        'Cannot find Kotlin Gradle Plugin classpath in android/build.gradle'
      );
    }

    contents = contents.replace(
      pattern,
      `classpath('org.jetbrains.kotlin:kotlin-gradle-plugin:${KOTLIN_VERSION}')`
    );

    // Không thêm dependency substitution cho Pika.

    config.modResults.contents = contents;
    return config;
  });
};