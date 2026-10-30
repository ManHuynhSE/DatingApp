
const { withProjectBuildGradle } = require('@expo/config-plugins');

const KOTLIN_VERSION = '2.4.20';

module.exports = function withKotlinGradlePlugin(config) {
  return withProjectBuildGradle(config, (config) => {
    let contents = config.modResults.contents;

    // Pin Kotlin Gradle Plugin.
    const kotlinPattern =
      /classpath\((['"])org\.jetbrains\.kotlin:kotlin-gradle-plugin\1\)/;

    if (kotlinPattern.test(contents)) {
      contents = contents.replace(
        kotlinPattern,
        `classpath('org.jetbrains.kotlin:kotlin-gradle-plugin:${KOTLIN_VERSION}')`
      );
    } else if (
      !contents.includes(
        `org.jetbrains.kotlin:kotlin-gradle-plugin:${KOTLIN_VERSION}`
      )
    ) {
      throw new Error(
        'Cannot find Kotlin Gradle Plugin classpath in android/build.gradle'
      );
    }

    // Redirect the unavailable Pika artifact to the Expo-maintained artifact.
    const marker = '// Expo Pika Kotlin 2.4.20 dependency substitution';

    if (!contents.includes(marker)) {
      contents += `

${marker}
allprojects {
  configurations.configureEach {
    resolutionStrategy.dependencySubstitution {
      substitute(module('io.github.lukmccall.pika:pika-compiler'))
        .using(module('io.github.expo.pika:pika-compiler:1.1.0-2.4.20'))
    }
  }
}
`;
    }

    config.modResults.contents = contents;

    return config;
  });
};
