const { withProjectBuildGradle } = require('@expo/config-plugins');

const KOTLIN_VERSION = '2.4.20';

module.exports = function withKotlinGradlePlugin(config) {
  return withProjectBuildGradle(config, (config) => {
    const contents = config.modResults.contents;

    const pattern =
      /classpath\((['"])org\.jetbrains\.kotlin:kotlin-gradle-plugin\1\)/;

    if (!pattern.test(contents)) {
      throw new Error(
        'Cannot find Kotlin Gradle Plugin classpath in android/build.gradle'
      );
    }

    config.modResults.contents = contents.replace(
      pattern,
      `classpath('org.jetbrains.kotlin:kotlin-gradle-plugin:${KOTLIN_VERSION}')`
    );

    return config;
  });
};